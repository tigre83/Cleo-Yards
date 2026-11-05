-- FASE 2.5: Valor fijo acordado por cliente (reemplaza precio por servicio)
-- Elm aclaró: no piensa en "precio por servicio" — cada cliente tiene UN valor
-- total acordado por el trabajo, fijo, sin importar cuántas visitas hubo ese mes.
-- Los servicios siguen existiendo como checklist (para saber qué actividades
-- se hacen en cada cliente) pero ya no llevan precio individual.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS agreed_value numeric(10,2);

-- Backfill: cada cliente arranca con la suma de lo que ya tenía en
-- client_services.custom_price (para no perder los valores ya cargados en Fase 2)
UPDATE clients c
SET agreed_value = COALESCE((
  SELECT SUM(COALESCE(cs.custom_price, 0) * COALESCE(cs.qty, 1))
  FROM client_services cs
  WHERE cs.client_id = c.id
), 0)
WHERE agreed_value IS NULL;

-- Nota: la columna client_services.custom_price queda en la tabla sin usarse
-- (no se borra por seguridad), pero el código ya no la lee ni la escribe.

-- Verificación rápida post-migración
-- SELECT id, name, agreed_value FROM clients ORDER BY name;
