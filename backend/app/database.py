import sqlite3
from datetime import datetime
from typing import Optional, Tuple
from .models import TicketData


class Database:

    """Maneja todas las operaciones de base de datos para tickets"""
    
    def __init__(self, db_path: str = "tickets.db"):

        """Inicializa la conexión a la base de datos y crea las tablas necesarias"""

        # Inicializar la conexión a la base de datos
        self.db_path = db_path

        # Crear la conexión a la base de datos
        self.conn = sqlite3.connect(db_path, check_same_thread=False)

        # Crear las tablas necesarias
        self._create_tables()
    
    def _create_tables(self):

        """Crea las tablas necesarias si no existen"""

        # Crear tabla de tickets
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                transaction_id TEXT NOT NULL UNIQUE,
                amount TEXT NOT NULL,
                currency TEXT NOT NULL,
                memo TEXT,
                issued_at TEXT NOT NULL,
                qr_data TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                validated_at TEXT,
                validated_by TEXT
            )
        """)

        # Agregar columna 'used' si no existe (para migración de bases de datos existentes)
        try:
            self.conn.execute("ALTER TABLE tickets ADD COLUMN used INTEGER NOT NULL DEFAULT 0")
        except sqlite3.OperationalError:
            pass  # La columna ya existe
        
        # Agregar columnas de validación si no existen
        try:
            self.conn.execute("ALTER TABLE tickets ADD COLUMN validated_at TEXT")
        except sqlite3.OperationalError:
            pass
        
        try:
            self.conn.execute("ALTER TABLE tickets ADD COLUMN validated_by TEXT")
        except sqlite3.OperationalError:
            pass

        # Commit de la transacción
        self.conn.commit()
    
    def transaction_exists(self, transaction_id: str) -> bool:

        """Verifica si una transacción ya fue procesada"""

        # Verificar si la transacción ya fue procesada
        cursor = self.conn.execute(
            "SELECT ticket_id FROM tickets WHERE transaction_id = ?",
            (transaction_id,)
        )

        # Retornar True si la transacción ya fue procesada, False en caso contrario
        return cursor.fetchone() is not None
    
    def save_ticket(self, ticket_data: TicketData) -> None:

        """Guarda un ticket en la base de datos"""

        # Obtener fecha de emisión
        issued_at = datetime.utcnow().isoformat() + "Z"

        # Insertar ticket en la base de datos
        self.conn.execute("""
            INSERT INTO tickets (ticket_id, username, transaction_id, amount, currency, memo, issued_at, qr_data, used)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_data.ticket_id,
            ticket_data.username,
            ticket_data.transaction_id,
            ticket_data.amount,
            ticket_data.currency,
            ticket_data.memo,
            issued_at,
            ticket_data.qr_data,
            1 if ticket_data.used else 0
        ))

        # Commit de la transacción
        self.conn.commit()
    
    def get_ticket(self, ticket_id: str) -> Optional[dict]:

        """Obtiene un ticket por su ID"""

        # Obtener el ticket por su ID
        cursor = self.conn.execute(
            "SELECT ticket_id, username, transaction_id, amount, currency, memo, issued_at, qr_data, used, validated_at, validated_by FROM tickets WHERE ticket_id = ?",
            (ticket_id,)
        )

        # Retornar el ticket si existe, None en caso contrario
        row = cursor.fetchone()
        if not row:
            return None

        # Retornar el ticket como diccionario
        return {
            "ticket_id": row[0],
            "username": row[1],
            "transaction_id": row[2],
            "amount": row[3],
            "currency": row[4],
            "memo": row[5],
            "issued_at": row[6],
            "qr_data": row[7],
            "used": bool(row[8]),
            "validated_at": row[9],
            "validated_by": row[10]
        }
    
    def validate_ticket(self, ticket_id: str, admin_username: str) -> bool:
        """Valida y quema un ticket (marca como usado)"""
        
        # Verificar que el ticket existe y no está usado
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return False
        
        if ticket["used"]:
            return False  # Ya está usado
        
        # Marcar como usado
        validated_at = datetime.utcnow().isoformat() + "Z"
        self.conn.execute("""
            UPDATE tickets 
            SET used = 1, validated_at = ?, validated_by = ?
            WHERE ticket_id = ?
        """, (validated_at, admin_username, ticket_id))
        
        self.conn.commit()
        return True
    
    def get_ticket_by_transaction(self, transaction_id: str) -> Optional[dict]:
        
        """Obtiene un ticket por transaction_id"""

        # Obtener el ticket por su transaction_id
        cursor = self.conn.execute(
            "SELECT ticket_id, username, transaction_id, amount, currency, memo, issued_at, qr_data FROM tickets WHERE transaction_id = ?",
            (transaction_id,)
        )

        # Obtener el ticket por su transaction_id
        row = cursor.fetchone()
        if not row:
            return None

        # Retornar el ticket
        return row
    
    def close(self):
        
        """Cierra la conexión a la base de datos"""

        # Cerrar la conexión a la base de datos
        self.conn.close()


# Instancia global de la base de datos
db = Database()