# Norma Sintética de Conciliación y Comisiones (Documento Primario R2)

- **Documento:** `R2-POL-CONCILIACION-2026`
- **Revisión:** `v1.0.0`
- **Vigencia:** `2026-01-01T00:00:00-06:00` a `2026-12-31T23:59:59-06:00`
- **Ámbito:** `environment=test`, `tenant=synth-co`, `timezone=America/Mexico_City`

## Sección 1.1 — Comisión por dispersión sintética
Para operaciones en moneda `MXN` bajo perfil `operador_estandar`, la comisión aplicable es exactamente `1.50%` sobre el monto principal, redondeada a 2 decimales (medio hacia arriba en centavos enteros), más un cargo fijo de `10.00 MXN` cuando `apply_fixed_fee = true`.

## Sección 1.2 — Fecha de corte y zona horaria
El corte diario ocurre a las `18:00:00` hora local (`America/Mexico_City`, UTC-6). Operaciones posteriores al corte se contabilizan en el día hábil siguiente.

## Sección 2.1 — Regla de conciliación
El neto a liquidar debe cumplir `net_cents = gross_cents - fee_cents`, sin discrepancia de centavos.
