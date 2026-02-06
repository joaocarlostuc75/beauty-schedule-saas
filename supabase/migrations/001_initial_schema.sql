-- SQL de inicialização para Beauty Schedule SaaS
-- Execute no SQL Editor do Supabase

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: Salons (multi-tenant base)
CREATE TABLE salons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    opening_time TIME NOT NULL DEFAULT '09:00',
    closing_time TIME NOT NULL DEFAULT '18:00',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_pass TEXT,
    smtp_from TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Users (admin e staff)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('ADMIN', 'STAFF')) DEFAULT 'STAFF',
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(salon_id, email)
);

-- Tabela: Services
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    start_time TIME,
    end_time TIME,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(salon_id, name, duration_minutes)
);

-- Tabela: Clients
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    lgpd_consent BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único composto para cliente por salão+email
CREATE UNIQUE INDEX idx_clients_salon_email ON clients(salon_id, email);

-- Tabela: Appointments
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED')) DEFAULT 'PENDING',
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    management_token TEXT UNIQUE,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_appointments_salon_status ON appointments(salon_id, status);
CREATE INDEX idx_appointments_datetime ON appointments(salon_id, start_datetime, end_datetime);
CREATE INDEX idx_appointments_token ON appointments(management_token);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- Tabela: Blocked Slots (férias, indisponibilidade)
CREATE TABLE blocked_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_salon ON blocked_slots(salon_id, start_datetime, end_datetime);

-- Tabela: Email Logs (registro de envios manuais)
CREATE TABLE email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('CONFIRMATION', 'REMINDER', 'CANCELLATION', 'COMPLETION')),
    sent_to TEXT NOT NULL,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('SENT', 'FAILED')) DEFAULT 'SENT',
    error_message TEXT
);

CREATE INDEX idx_email_logs_appointment ON email_logs(appointment_id);

-- Função: Verificar disponibilidade (evita overbooking)
CREATE OR REPLACE FUNCTION check_availability(
    p_salon_id UUID,
    p_start TIMESTAMP WITH TIME ZONE,
    p_end TIMESTAMP WITH TIME ZONE,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE salon_id = p_salon_id
        AND status IN ('PENDING', 'CONFIRMED', 'RESCHEDULED')
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
        AND (start_datetime, end_datetime) OVERLAPS (p_start, p_end)
    ) AND NOT EXISTS (
        SELECT 1 FROM blocked_slots
        WHERE salon_id = p_salon_id
        AND (start_datetime, end_datetime) OVERLAPS (p_start, p_end)
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de exemplo (opcional)
-- INSERT INTO salons (name, email, opening_time, closing_time) 
-- VALUES ('Salão Exemplo', 'contato@salaobeauty.com', '09:00', '18:00');