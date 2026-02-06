-- Migration 002: Adicionar suporte a WhatsApp e logs de notificações

-- Adicionar campo whatsapp_number na tabela salons
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Criar tabela de logs de notificações (WhatsApp)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('CONFIRMATION', 'REMINDER', 'CANCELLATION', 'RESCHEDULED')) NOT NULL,
    channel TEXT CHECK (channel IN ('WHATSAPP')) NOT NULL DEFAULT 'WHATSAPP',
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('PENDING', 'SENT', 'FAILED')) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar logs por agendamento
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment_id ON notification_logs(appointment_id);

-- Índice para buscar logs por data
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Trigger para atualizar o status quando necessário (opcional, pode ser feito via aplicação)
-- Comentários explicativos:
-- A tabela notification_logs registra todas as tentativas de envio de WhatsApp
-- Status PENDING: admin clicou no botão, link gerado, aguardando envio real
-- Status SENT: (opcional) pode ser atualizado manualmente se o admin confirmar envio
-- Status FAILED: (opcional) se houver erro na geração do link

-- Atualizar timestamp automaticamente (se quiser usar updated_at no futuro)
-- Por enquanto usamos apenas created_at pois os logs são imutáveis após criação