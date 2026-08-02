-- FASE 2: Precio personalizado por cliente-servicio
-- Elm reportó que casi todos sus clientes tienen 3 servicios, y NINGUNO tiene
-- el mismo precio — el catálogo "services.price" ya no representa la realidad.
-- Esta migración agrega un precio propio por combinación cliente-servicio.

ALTER TABLE client_services ADD COLUMN IF NOT EXISTS custom_price numeric(10,2);

-- Backfill: las filas existentes arrancan con el precio actual del catálogo
-- como punto de partida (el landscaper los ajusta después, uno por uno, en la UI)
UPDATE client_services cs
SET custom_price = s.price
FROM services s
WHERE cs.service_id = s.id AND cs.custom_price IS NULL;

-- Verificación rápida post-migración
-- SELECT cs.id, c.name AS client, s.name AS service, s.price AS catalog_price, cs.custom_price
-- FROM client_services cs
-- JOIN clients c ON c.id = cs.client_id
-- JOIN services s ON s.id = cs.service_id
-- ORDER BY c.name;
