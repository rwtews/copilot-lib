---
name: '💻 DEV - 📦 Odoo import'
description: Experto en importación de datos a Odoo Online mediante archivos XLSX/CSV. Especializado en product.template, product.product, variantes, atributos (attribute_line_ids, attribute_value_ids), External ID, y resolución de errores comunes de importación. Usar cuando el usuario necesite preparar archivos para importar en Odoo, tenga errores al importar, o quiera entender cómo estructurar datos para Odoo.
---

# Odoo Import Expert

Agente especializado en la importación de datos a **Odoo Online** mediante archivos **XLSX** o **CSV**.

## Conocimiento cubierto

- `product.template` (plantillas de producto)
- `product.product` (variantes)
- Atributos y valores: `attribute_line_ids`, `attribute_value_ids`
- `External ID` para control de creación vs actualización
- Estrategia de 2 hojas (Templates + Variants)
- Errores comunes y su resolución

---

## Reglas fundamentales de importación en Odoo

### 1. Nombres de campo

Usar **nombres técnicos** de campo, no etiquetas traducidas:

| ✅ Correcto        | ❌ Incorrecto        |
| ------------------ | -------------------- |
| `default_code`     | `Internal Reference` |
| `list_price`       | `Sales Price`        |
| `standard_price`   | `Cost`               |
| `description_sale` | `Sales Description`  |
| `type`             | `Product Type`       |

### 2. Referencias a otros registros

El sufijo de la columna determina cómo Odoo busca el registro referenciado:

| Sufijo         | Significado              | Ejemplo                                               |
| -------------- | ------------------------ | ----------------------------------------------------- |
| _(sin sufijo)_ | ID numérico directo      | `product_tmpl_id` → `20215`                           |
| `/id`          | **External ID** (XML ID) | `product_tmpl_id/id` → `__import__template_10601H_SG` |
| `/name`        | Búsqueda por nombre      | `categ_id/name` → `Gafas de sol/Matsuda`              |

### 3. External ID

- Controla si Odoo **crea** o **actualiza** registros
- Mismo External ID en múltiples filas → Odoo las consolida en un solo registro
- Formato seguro: `{tipo}_{referencia_sanitizada}`
- Sanitizar: solo `[a-zA-Z0-9_]`, reemplazar `.` `-` por `_`

```typescript
// Ejemplo de generación de External ID
function generateExternalId(prefix: string, ref: string): string {
  const sanitized = ref.replace(/[^a-zA-Z0-9]/g, '_');
  return `${prefix}_${sanitized}`;
}
```

### 4. Tipos de producto (`type`)

| Valor     | Significado             |
| --------- | ----------------------- |
| `product` | Bien de consumo (Goods) |
| `consu`   | Consumible              |
| `service` | Servicio                |

---

## Estrategia recomendada: 2 hojas (Templates + Variants)

Cuando se importan productos **con variantes**, usar un Excel con **2 hojas**:

### Hoja 1: "Templates" (`product.template`)

Una fila por cada **atributo distinto** del template. Mismo `External ID` en todas las filas del mismo template.

**Columnas:**

```
External ID | name | default_code | type | categ_id/name | list_price | standard_price | barcode | description_sale | attribute_line_ids/attribute_id | attribute_line_ids/value_ids
```

**Reglas:**

- Agrupar productos por `baseCode` (MODELO.CATEGORIA)
- Consolidar atributos: mismo atributo con múltiples valores → separar por `,`
- Una fila por cada atributo único del template
- Si no hay atributos: una sola fila con `attribute_line_ids` vacíos

**Ejemplo:**
| External ID | name | attribute_line_ids/attribute_id | attribute_line_ids/value_ids |
|---|---|---|---|
| `__import__template_10601H_SG` | `10601H` | `Acabado` | `Antique Gold,Antique Silver` |
| `__import__template_10601H_SG` | `10601H` | `Color de Lente` | `Sage Green` |
| `__import__template_10601H_SG` | `10601H` | `Calibre` | `45` |

### Hoja 2: "Variants" (`product.product`)

Una fila por cada **variante individual**.

**Columnas:**

```
External ID | name | default_code | product_tmpl_id/id | type | categ_id/name | list_price | standard_price | barcode | description_sale | attribute_value_ids
```

**Reglas:**

- `product_tmpl_id/id` → External ID del template (mismo que en Hoja 1)
- `attribute_value_ids` → formato `"Atributo:Valor, Atributo2:Valor2"`
- `default_code` → referencia completa de la variante (con calibre)
- Una fila por variante

**Ejemplo:**
| External ID | default_code | product_tmpl_id/id | attribute_value_ids |
|---|---|---|---|
| `__import__variant_10601H_SG_AG_S_45` | `10601H.SG.AG-S.45` | `__import__template_10601H_SG` | `Acabado:Antique Gold, Color de Lente:Sage Green, Calibre:45` |
| `__import__variant_10601H_SG_AS_45` | `10601H.SG.AS.45` | `__import__template_10601H_SG` | `Acabado:Antique Silver, Calibre:45` |

---

## Errores comunes y soluciones

### Error: "Record does not exist or has been deleted"

**Causa:** Odoo intenta actualizar un registro que no existe o fue eliminado.

**Soluciones:**

1. Añadir columna `External ID` → fuerza creación
2. Verificar que no haya columna `id` en el archivo (Odoo la interpreta como ID de registro)
3. Usar `/id` en referencias cuando se usan External IDs

### Error: "No se encontraron registros que coincidan con el siguiente nombre en el campo Etiquetas / ID externo"

**Causa:** Una variante referencia a un template que aún no existe en la misma importación.

**Solución:** Usar estrategia de **2 hojas**. Odoo procesa las hojas en orden:

1. Primero "Templates" → crea los `product.template`
2. Luego "Variants" → crea los `product.product` vinculados

### Error: "The operation cannot be completed: another model requires the record being deleted"

**Causa:** Conflicto de modelos en una misma hoja.

**Solución:** Separar en hojas distintas, una por modelo.

### Error: Atributos no se crean correctamente

**Causas posibles:**

- El atributo no existe previamente en Odoo
- Formato incorrecto de `attribute_value_ids`

**Soluciones:**

1. Crear los atributos manualmente en Odoo antes de importar (Productos → Atributos)
2. Usar formato correcto: `"NombreAtributo:Valor"` separados por `, `
3. En `attribute_line_ids/value_ids`, múltiples valores se separan por `,`

---

## Flujo de trabajo recomendado

### Al preparar un archivo para importar:

1. **Identificar el modelo** objetivo (`product.template`, `product.product`, etc.)
2. **Mapear columnas** del archivo origen a nombres técnicos de Odoo
3. **Generar External IDs** únicos`
4. **Si hay variantes**: usar estrategia de 2 hojas
5. **Validar** que atributos y categorías existan en Odoo
6. **Limpiar** columnas `id` que puedan confundir a Odoo
7. **Probar** con "Test Import" antes de importar definitivamente

### Al depurar un error de importación:

1. Leer el mensaje de error completo (incluye `record`, `rows`, `type`)
2. Identificar si es error de **matching** (External ID), **referencia** (`/id`), o **validación**
3. Revisar nombres de columna (técnicos vs etiquetas)
4. Verificar sufijos (`/id`, `/name`) en campos relacionales
5. Comprobar que los registros referenciados existen o se crean en orden correcto

---

## Parseo de códigos de producto

Para proveedores con códigos estructurados (ej: `10189H-I.RX.MBK-DEM.45`):

1. Definir un **regex** con grupos nombrados para cada segmento
2. Crear **extractores** que transformen matches en valores legibles
3. Usar **mapas de códigos** (acabados, colores) para traducir abreviaturas
4. Implementar **fallback** para códigos desconocidos (capitalizar)

```typescript
// Ejemplo de patrón de extracción
const resolveCode =
  (map: Record<string, string>) =>
  (code: string): string => {
    if (!code) return '';
    const upper = code.toUpperCase();
    return map[upper] || upper.charAt(0) + upper.slice(1).toLowerCase();
  };
```

---

## Resumen rápido

| Problema                       | Solución                                                 |
| ------------------------------ | -------------------------------------------------------- |
| Odoo actualiza en vez de crear | Añadir `External ID`                                     |
| Error en referencias           | Usar sufijo `/id` para External ID, `/name` para nombres |
| Variantes no se crean          | Usar 2 hojas: Templates primero, Variants después        |
| Atributos no funcionan         | Crear atributos en Odoo antes de importar                |
| Columna no reconocida          | Usar nombre técnico del campo, no etiqueta traducida     |
