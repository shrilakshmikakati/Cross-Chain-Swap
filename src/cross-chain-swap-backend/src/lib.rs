use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_balance, bitcoin_get_utxos, bitcoin_send_transaction,
    BitcoinNetwork, GetBalanceRequest, GetUtxosRequest, SendTransactionRequest, Utxo,
};
use ic_cdk::api::management_canister::ecdsa::{
    ecdsa_public_key, EcdsaCurve, EcdsaKeyId, EcdsaPublicKeyArgument,
};
use ic_cdk::{api, caller, id};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;
use sha2::{Digest, Sha256};

// Types and Constants
const BITCOIN_NETWORK: BitcoinNetwork = BitcoinNetwork::Testnet;
const KEY_NAME: &str = "dfx_test_key";

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ChainType {
    Bitcoin,
    Ethereum,
    ICP,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SwapStatus {
    Pending,
    Locked,
    Verified,
    Completed,
    Failed,
    Refunded,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SwapRequest {
    pub id: String,
    pub initiator: Principal,
    pub source_chain: ChainType,
    pub target_chain: ChainType,
    pub source_amount: u64,
    pub target_amount: u64,
    pub source_address: String,
    pub target_address: String,
    pub hash_lock: String,
    pub timeout: u64,
    pub status: SwapStatus,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SwapResponse {
    pub success: bool,
    pub message: String,
    pub swap_id: Option<String>,
    pub transaction_hash: Option<String>,
}

// State Management
thread_local! {
    static SWAPS: RefCell<HashMap<String, SwapRequest>> = RefCell::new(HashMap::new());
    static BITCOIN_ADDRESSES: RefCell<HashMap<Principal, String>> = RefCell::new(HashMap::new());
    static ETHEREUM_ADDRESSES: RefCell<HashMap<Principal, String>> = RefCell::new(HashMap::new());
    static EXCHANGE_RATES: RefCell<HashMap<String, f64>> = RefCell::new(HashMap::new());
}

// Initialization
#[init]
fn init() {
    // Initialize exchange rates (in production, fetch from oracles)
    EXCHANGE_RATES.with(|rates| {
        let mut rates = rates.borrow_mut();
        rates.insert("BTC-ETH".to_string(), 15.5);
        rates.insert("ETH-BTC".to_string(), 0.065);
        rates.insert("BTC-ICP".to_string(), 100000.0);
        rates.insert("ICP-BTC".to_string(), 0.00001);
    });
}

// Bitcoin Integration Functions
#[update]
async fn get_bitcoin_address() -> Result<String, String> {
    let caller = caller();
    
    // Check if address already exists
    let existing_address = BITCOIN_ADDRESSES.with(|addrs| {
        addrs.borrow().get(&caller).cloned()
    });
    
    if let Some(addr) = existing_address {
        return Ok(addr);
    }

    // Generate new Bitcoin address using threshold ECDSA
    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: KEY_NAME.to_string(),
    };

    let derivation_path = vec![caller.as_slice().to_vec()];

    let public_key_result = ecdsa_public_key(EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: derivation_path.clone(),
        key_id: key_id.clone(),
    })
    .await
    .map_err(|e| format!("Failed to get public key: {:?}", e))?;

    // Convert public key to Bitcoin address (P2PKH)
    let bitcoin_address = public_key_to_bitcoin_address(&public_key_result.0.public_key);
    
    // Store address
    BITCOIN_ADDRESSES.with(|addrs| {
        addrs.borrow_mut().insert(caller, bitcoin_address.clone());
    });

    Ok(bitcoin_address)
}

#[update]
async fn get_bitcoin_balance(address: String) -> Result<u64, String> {
    let balance_request = GetBalanceRequest {
        address,
        network: BITCOIN_NETWORK,
        min_confirmations: Some(1),
    };

    let balance_result = bitcoin_get_balance(balance_request)
        .await
        .map_err(|e| format!("Failed to get Bitcoin balance: {:?}", e))?;

    Ok(balance_result.0)
}

// Ethereum Integration Functions  
#[update]
async fn get_ethereum_address() -> Result<String, String> {
    let caller = caller();
    
    let existing_address = ETHEREUM_ADDRESSES.with(|addrs| {
        addrs.borrow().get(&caller).cloned()
    });
    
    if let Some(addr) = existing_address {
        return Ok(addr);
    }

    // Generate Ethereum address using threshold ECDSA
    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: KEY_NAME.to_string(),
    };

    let derivation_path = vec![caller.as_slice().to_vec()];

    let public_key_result = ecdsa_public_key(EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id,
    })
    .await
    .map_err(|e| format!("Failed to get public key: {:?}", e))?;

    // Convert public key to Ethereum address
    let ethereum_address = public_key_to_ethereum_address(&public_key_result.0.public_key);
    
    ETHEREUM_ADDRESSES.with(|addrs| {
        addrs.borrow_mut().insert(caller, ethereum_address.clone());
    });

    Ok(ethereum_address)
}

// Core Swap Functions
#[update]
async fn initiate_swap(
    source_chain: ChainType,
    target_chain: ChainType,
    source_amount: u64,
    target_address: String,
) -> Result<SwapResponse, String> {
    let caller = caller();
    let swap_id = generate_swap_id();
    let current_time = api::time();
    
    // Calculate target amount using exchange rates
    let rate_key = format!("{:?}-{:?}", source_chain, target_chain);
    let exchange_rate = EXCHANGE_RATES.with(|rates| {
        rates.borrow().get(&rate_key).copied().unwrap_or(1.0)
    });
    
    let target_amount = ((source_amount as f64) * exchange_rate) as u64;
    
    // Generate hash lock for HTLC
    let hash_lock = generate_hash_lock();
    
    // Get source address based on chain
    let source_address = match source_chain {
        ChainType::Bitcoin => get_bitcoin_address().await?,
        ChainType::Ethereum => get_ethereum_address().await?,
        ChainType::ICP => caller.to_string(),
    };

    let swap_request = SwapRequest {
        id: swap_id.clone(),
        initiator: caller,
        source_chain,
        target_chain,
        source_amount,
        target_amount,
        source_address,
        target_address,
        hash_lock,
        timeout: current_time + 3600_000_000_000, // 1 hour timeout
        status: SwapStatus::Pending,
        created_at: current_time,
    };

    // Store swap request
    SWAPS.with(|swaps| {
        swaps.borrow_mut().insert(swap_id.clone(), swap_request);
    });

    Ok(SwapResponse {
        success: true,
        message: "Swap initiated successfully".to_string(),
        swap_id: Some(swap_id),
        transaction_hash: None,
    })
}

#[update]
async fn execute_swap(swap_id: String) -> Result<SwapResponse, String> {
    let caller = caller();
    
    // Get swap request
    let swap = SWAPS.with(|swaps| {
        swaps.borrow().get(&swap_id).cloned()
    }).ok_or("Swap not found")?;

    // Verify caller is the initiator
    if swap.initiator != caller {
        return Err("Unauthorized".to_string());
    }

    // Check if swap is still valid
    if api::time() > swap.timeout {
        update_swap_status(&swap_id, SwapStatus::Failed);
        return Err("Swap timeout exceeded".to_string());
    }

    match swap.status {
        SwapStatus::Pending => {
            // Lock source assets
            let lock_result = lock_source_assets(&swap).await?;
            update_swap_status(&swap_id, SwapStatus::Locked);
            
            Ok(SwapResponse {
                success: true,
                message: "Assets locked successfully".to_string(),
                swap_id: Some(swap_id),
                transaction_hash: Some(lock_result),
            })
        },
        SwapStatus::Locked => {
            // Verify lock and release target assets
            let release_result = release_target_assets(&swap).await?;
            update_swap_status(&swap_id, SwapStatus::Completed);
            
            Ok(SwapResponse {
                success: true,
                message: "Swap completed successfully".to_string(),
                swap_id: Some(swap_id),
                transaction_hash: Some(release_result),
            })
        },
        _ => Err("Invalid swap status for execution".to_string()),
    }
}

// Asset Locking Functions
async fn lock_source_assets(swap: &SwapRequest) -> Result<String, String> {
    match swap.source_chain {
        ChainType::Bitcoin => lock_bitcoin_assets(swap).await,
        ChainType::Ethereum => lock_ethereum_assets(swap).await,
        ChainType::ICP => lock_icp_assets(swap).await,
    }
}

async fn lock_bitcoin_assets(swap: &SwapRequest) -> Result<String, String> {
    // Get UTXOs for the source address
    let utxos_request = GetUtxosRequest {
        address: swap.source_address.clone(),
        network: BITCOIN_NETWORK,
        filter: None,
    };

    let utxos_result = bitcoin_get_utxos(utxos_request)
        .await
        .map_err(|e| format!("Failed to get UTXOs: {:?}", e))?;

    // Create transaction to lock Bitcoin (simplified)
    // In production, you'd create a proper HTLC script
    let tx_bytes = create_bitcoin_htlc_transaction(
        &utxos_result.0.utxos,
        &swap.target_address,
        swap.source_amount,
        &swap.hash_lock,
    )?;

    // Send transaction
    let send_request = SendTransactionRequest {
        transaction: tx_bytes.clone(),
        network: BITCOIN_NETWORK,
    };

    bitcoin_send_transaction(send_request)
        .await
        .map_err(|e| format!("Failed to send Bitcoin transaction: {:?}", e))?;

    // Calculate and return transaction ID
    let tx_id = calculate_bitcoin_txid(&tx_bytes);
    Ok(hex::encode(tx_id))
}

async fn lock_ethereum_assets(swap: &SwapRequest) -> Result<String, String> {
    // Create Ethereum HTLC transaction
    // This would interact with an HTLC smart contract on Ethereum
    let tx_hash = create_ethereum_htlc_transaction(
        &swap.source_address,
        &swap.target_address,
        swap.source_amount,
        &swap.hash_lock,
        swap.timeout,
    ).await?;

    Ok(tx_hash)
}

async fn lock_icp_assets(_swap: &SwapRequest) -> Result<String, String> {
    // For ICP, we'd transfer tokens to the canister's escrow
    // This is simplified - in production you'd use ICRC-1 token standards
    Ok("icp_lock_tx_".to_string() + &generate_transaction_id())
}

// Asset Release Functions
async fn release_target_assets(swap: &SwapRequest) -> Result<String, String> {
    match swap.target_chain {
        ChainType::Bitcoin => release_bitcoin_assets(swap).await,
        ChainType::Ethereum => release_ethereum_assets(swap).await,
        ChainType::ICP => release_icp_assets(swap).await,
    }
}

async fn release_bitcoin_assets(swap: &SwapRequest) -> Result<String, String> {
    // Create Bitcoin transaction to release assets from HTLC
    let tx_bytes = create_bitcoin_release_transaction(
        &swap.target_address,
        swap.target_amount,
        &swap.hash_lock,
    )?;

    let send_request = SendTransactionRequest {
        transaction: tx_bytes.clone(),
        network: BITCOIN_NETWORK,
    };

    bitcoin_send_transaction(send_request)
        .await
        .map_err(|e| format!("Failed to send Bitcoin transaction: {:?}", e))?;

    let tx_id = calculate_bitcoin_txid(&tx_bytes);
    Ok(hex::encode(tx_id))
}

async fn release_ethereum_assets(swap: &SwapRequest) -> Result<String, String> {
    // Release assets from Ethereum HTLC contract
    let tx_hash = release_ethereum_htlc_assets(
        &swap.target_address,
        swap.target_amount,
        &swap.hash_lock,
    ).await?;

    Ok(tx_hash)
}

async fn release_icp_assets(_swap: &SwapRequest) -> Result<String, String> {
    // Transfer ICP tokens from escrow to target address
    Ok("icp_release_tx_".to_string() + &generate_transaction_id())
}

// Query Functions
#[query]
fn get_swap_details(swap_id: String) -> Result<SwapRequest, String> {
    SWAPS.with(|swaps| {
        swaps.borrow().get(&swap_id).cloned()
    }).ok_or("Swap not found".to_string())
}

#[query]
fn get_user_swaps() -> Vec<SwapRequest> {
    let caller = caller();
    SWAPS.with(|swaps| {
        swaps.borrow()
            .values()
            .filter(|swap| swap.initiator == caller)
            .cloned()
            .collect()
    })
}

#[query]
fn get_exchange_rate(from: ChainType, to: ChainType) -> f64 {
    let rate_key = format!("{:?}-{:?}", from, to);
    EXCHANGE_RATES.with(|rates| {
        rates.borrow().get(&rate_key).copied().unwrap_or(1.0)
    })
}

// Utility Functions
fn generate_swap_id() -> String {
    let timestamp = api::time();
    let caller = caller();
    let combined = format!("{}{}", timestamp, caller.to_string());
    hex::encode(Sha256::digest(combined.as_bytes()))
}

fn generate_hash_lock() -> String {
    let secret = format!("{}{}", api::time(), id().to_string());
    hex::encode(Sha256::digest(secret.as_bytes()))
}

fn generate_transaction_id() -> String {
    hex::encode(&api::time().to_be_bytes())
}

fn update_swap_status(swap_id: &str, status: SwapStatus) {
    SWAPS.with(|swaps| {
        if let Some(swap) = swaps.borrow_mut().get_mut(swap_id) {
            swap.status = status;
        }
    });
}

fn public_key_to_bitcoin_address(public_key: &[u8]) -> String {
    // Simplified Bitcoin address generation
    // In production, implement proper P2PKH address generation
    format!("tb1q{}", hex::encode(&public_key[..20]))
}

fn public_key_to_ethereum_address(public_key: &[u8]) -> String {
    // Simplified Ethereum address generation  
    // In production, use Keccak-256 hash and proper formatting
    format!("0x{}", hex::encode(&public_key[12..32]))
}

fn calculate_bitcoin_txid(tx_bytes: &[u8]) -> [u8; 32] {
    // Calculate double SHA256 hash for Bitcoin transaction ID
    let first_hash = Sha256::digest(tx_bytes);
    let second_hash = Sha256::digest(&first_hash);
    let mut txid = [0u8; 32];
    txid.copy_from_slice(&second_hash);
    txid
}

// Simplified transaction creation functions
fn create_bitcoin_htlc_transaction(
    _utxos: &[Utxo],
    _target_address: &str,
    _amount: u64,
    _hash_lock: &str,
) -> Result<Vec<u8>, String> {
    // This would create a proper Bitcoin HTLC transaction
    // For now, return dummy transaction bytes
    let mut tx_bytes = vec![0u8; 250];
    // Add some randomness to make each transaction unique
    let timestamp = api::time().to_be_bytes();
    tx_bytes[..8].copy_from_slice(&timestamp);
    Ok(tx_bytes)
}

async fn create_ethereum_htlc_transaction(
    _from: &str,
    _to: &str,
    _amount: u64,
    _hash_lock: &str,
    _timeout: u64,
) -> Result<String, String> {
    // This would create an Ethereum transaction to interact with HTLC contract
    Ok("0x".to_string() + &generate_transaction_id())
}

fn create_bitcoin_release_transaction(
    _target_address: &str,
    _amount: u64,
    _hash_lock: &str,
) -> Result<Vec<u8>, String> {
    // Create transaction to claim from Bitcoin HTLC
    let mut tx_bytes = vec![0u8; 250];
    let timestamp = api::time().to_be_bytes();
    tx_bytes[..8].copy_from_slice(&timestamp);
    Ok(tx_bytes)
}

async fn release_ethereum_htlc_assets(
    _target_address: &str,
    _amount: u64,
    _hash_lock: &str,
) -> Result<String, String> {
    // Release from Ethereum HTLC contract
    Ok("0x".to_string() + &generate_transaction_id())
}

// Pre/Post upgrade hooks
#[pre_upgrade]
fn pre_upgrade() {
    // Store state before upgrade - implement serialization of state
    // This is where you'd save SWAPS, BITCOIN_ADDRESSES, etc. to stable storage
}

#[post_upgrade] 
fn post_upgrade() {
    // Restore state after upgrade - implement deserialization of state
    // This is where you'd restore SWAPS, BITCOIN_ADDRESSES, etc. from stable storage
    init(); // Re-initialize exchange rates
}