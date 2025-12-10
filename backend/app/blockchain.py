from decimal import Decimal
from fastapi import HTTPException
from beem import Hive
from beem.blockchain import Blockchain
from .config import EXPECTED_DEST, EXPECTED_AMOUNT, EXPECTED_CURRENCY


def verify_transaction(txid: str, username: str):

    """Verifica que la transacción existe y tiene el monto esperado"""
    
    # Inicializar Hive cliente
    hive = Hive(node=["https://api.hive.blog", "https://rpc.ecency.com"])

    # Inicializar blockchain
    blockchain = Blockchain(hive_instance=hive)

    try:
        # Consultar transacción por trx_id
        tx = hive.get_transaction(txid)
        if not tx:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        # Buscar operación de transferencia
        ops = tx.get("operations", [])
        transfer_op = next((op for op in ops if op and op[0] == "transfer"), None)
        
        # Validar que la operación de transferencia exista
        if not transfer_op:
            raise HTTPException(status_code=400, detail="La transacción no contiene una operación de transferencia")
        
        transfer = transfer_op[1]
        
        # Validar destinatario
        if transfer["to"].lower() != EXPECTED_DEST.lower():
            raise HTTPException(
                status_code=400, 
                detail=f"Destino incorrecto. Esperado: {EXPECTED_DEST}, Recibido: {transfer['to']}"
            )
        
        # Validar remitente
        if transfer["from"].lower() != username.lower():
            raise HTTPException(
                status_code=400, 
                detail=f"Usuario no coincide. Esperado: {username}, Recibido: {transfer['from']}"
            )
        
        # Validar monto y moneda
        try:
            amount_str, currency = transfer["amount"].split()
            amount = Decimal(amount_str)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Formato de monto inválido en la transacción")
        
        if currency.upper() != EXPECTED_CURRENCY.upper():
            raise HTTPException(
                status_code=400, 
                detail=f"Moneda incorrecta. Esperada: {EXPECTED_CURRENCY}, Recibida: {currency}"
            )
        
        if amount != EXPECTED_AMOUNT:
            raise HTTPException(
                status_code=400, 
                detail=f"Monto incorrecto. Esperado: {EXPECTED_AMOUNT}, Recibido: {amount}"
            )
        
        # Todo válido, retornar datos de la transferencia
        return transfer
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar transacción: {str(e)}")
