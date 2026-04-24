# ARCHITECTURE.md — Reglas para agentes de IA

> **A quién va dirigido:** cualquier agente de IA (Claude, Copilot, Cursor, etc.) que modifique código en este repositorio. Leer completo antes de proponer cambios. Leer de nuevo si el cambio toca más de un archivo.
>
> **Convención de palabras clave:**
>
> - **MUST / DEBE** → regla inviolable. Romperla es un bug, incluso si el test pasa.
> - **SHOULD / DEBERÍA** → regla fuerte. Romperla requiere justificación explícita en el mensaje del PR.
> - **MAY / PUEDE** → opcional, a criterio del agente.

---

## 0. Principios rectores

Antes de cualquier regla específica, estos cinco principios explican el **por qué** de todo lo demás. Si una regla parece no aplicar a un caso nuevo, razona desde estos principios.

1. **Capas unidireccionales.** El código fluye de datos → dominio → presentación. Nunca al revés.
2. **El dominio no sabe de Shopify.** Los tipos de `domain/` no tienen campos `edges`, `node`, `cursor`, ni nombres acoplados a GraphQL. Si Shopify cambia, solo `services/` se modifica.
3. **Una sola forma de hacer cada cosa.** Hay un cliente HTTP, un sistema de cache, un sistema de estado UI, una forma de leer env vars, una forma de guardar secretos. Duplicarlos es el principal antipatrón a evitar.
4. **Explícito > mágico.** No auto-imports escondidos, no side-effects en import, no singletons globales silenciosos.
5. **El agente no inventa dependencias.** Si una librería no está en `package.json`, no la uses. Si necesitas una nueva, propónla con justificación; no la instales como efecto colateral.

---

## 1. Arquitectura del sistema (contexto)

**Patrón elegido:** 100% Shopify — sin backend propio.

```
                    ┌──→  Storefront API (catálogo + carrito anónimo) — directo
App RN (Expo) ──────┤
                    ├──→  Customer Accounts hospedadas (via expo-web-browser)
                    │
                    └──→  Checkout Kit (presenta checkoutUrl, login opcional in-checkout)
```

**Consecuencias inviolables para el agente:**

- La app **SÍ** puede llamar a Storefront API directamente con el token de Storefront.
- La app **NO** mantiene `customerAccessToken` ni ningún token de cliente.
- La app **NO** implementa pantallas propias de login, registro, recuperación de contraseña, ni gestión de cuenta. Todo eso vive en las páginas hospedadas de Shopify y se abre con `expo-web-browser`.
- La app **NUNCA** llama al Admin API ni al Customer Account API (OAuth) bajo ninguna circunstancia.
- El checkout se abre **solo** con Checkout Kit; no se construyen URLs de checkout a mano, no se reconstruye el checkout en la app.
- El carrito creado desde la app es **siempre anónimo**: nunca se incluye `buyerIdentity` en `cartCreate`, `cartLinesUpdate`, etc.
- Si el usuario quiere autenticarse para usar direcciones o métodos de pago guardados, lo hace **dentro** del Checkout Kit. La app no se entera ni necesita enterarse.

---

## 2. Capas y dirección de dependencias

```
    ┌────────────────────────────────────────┐
    │  app/      (Expo Router, pantallas)    │  ← UI
    └──────────────────┬─────────────────────┘
                       │ depende de
    ┌──────────────────▼─────────────────────┐
    │  features/{feature}/                   │  ← lógica de feature
    │  (hooks, componentes, screens locales) │
    └──────┬──────────────────────────┬──────┘
           │                          │
           │ depende de               │ depende de
           │                          │
    ┌──────▼───────┐          ┌───────▼──────┐
    │  services/   │          │   domain/    │  ← contratos
    │  (Shopify)   │  depende │   (tipos,    │
    │              │──────────▶│   lógica    │
    │              │   de     │   pura)      │
    └──────────────┘          └──────────────┘
                                     ▲
                                     │
                                     │   providers/ , lib/  ← utilidades
                                     │   (dependencias externas OK)
```

### Reglas de importación

| Desde \ Hacia | `app` |       `features`       | `services` | `domain` | `providers` | `lib` |
| ------------- | :---: | :--------------------: | :--------: | :------: | :---------: | :---: |
| `app`         |   ✓   |           ✓            |     ✗      |    ✓     |      ✓      |   ✓   |
| `features`    |   ✗   | ✓ (solo misma feature) |     ✓      |    ✓     |      ✗      |   ✓   |
| `services`    |   ✗   |           ✗            |     ✓      |    ✓     |      ✗      |   ✓   |
| `domain`      |   ✗   |           ✗            |     ✗      |    ✓     |      ✗      |   ✗   |
| `providers`   |   ✗   |  ✓ (solo hooks/keys)   |     ✗      |    ✓     |      ✓      |   ✓   |
| `lib`         |   ✗   |           ✗            |     ✗      |    ✗     |      ✗      |   ✓   |

**Reglas derivadas:**

- **MUST:** `domain/` no importa NADA fuera de sí mismo. Ni React, ni fetch, ni Expo, ni Shopify.
- **MUST:** `services/` no importa de `features/` ni de `app/`.
- **MUST:** una feature no importa de otra feature. Si dos features comparten lógica, esa lógica baja a `domain/` o a `services/`.
- **MUST:** `app/` contiene solo rutas y composición. La lógica vive en `features/`.

---

## 3. Responsabilidades por carpeta

### `src/lib/`

**Qué contiene:** utilidades transversales sin lógica de negocio. `env.ts`, `secure-storage.ts`, eventuales helpers como `format-date.ts`.

**Qué NO contiene:**

- Nada relacionado con Shopify (ese es `services/`).
- Nada relacionado con features concretos.
- Ni un solo `useQuery` o hook.

**Regla de acceso a env:** todo acceso a variables de entorno **DEBE** pasar por `lib/env.ts`. Ningún archivo fuera de ahí puede leer `process.env` o `Constants.expoConfig.extra` directamente.

**Regla de acceso a secure-storage:** todo uso de `expo-secure-store` **DEBE** pasar por `lib/secure-storage.ts` y usar una clave definida en `StorageKeys`. Strings sueltos como `SecureStore.getItemAsync('cartId')` están prohibidos.

### `src/domain/`

**Qué contiene:** tipos de negocio (`Product`, `Cart`, `Money`, `CartLine`) y funciones puras sobre ellos (`formatMoney`, `calculateCartSubtotal`).

**Qué NO contiene:**

- **NUNCA** tipos con forma de GraphQL (`edges`, `node`, `PageInfo`).
- **NUNCA** importaciones de React, React Native, Expo, `@tanstack/react-query`, `fetch`, ni SDKs.
- **NUNCA** side effects. Solo datos y funciones puras.
- **NUNCA** un tipo `Customer` o `CustomerAccessToken`. En este modelo, la app no tiene representación de cliente autenticado.

**Test implícito:** si un archivo de `domain/` se ejecutara en Node.js puro sin bundler, debe funcionar.

### `src/services/shopify/`

**Qué contiene:**

- `storefront.ts` — **único** punto de salida HTTP hacia Shopify. Todas las queries y mutations lo usan.
- `fragments.ts` — fragments de GraphQL reutilizables.
- `queries/*.ts` — queries agrupadas por recurso.
- `mutations/*.ts` — mutations agrupadas por recurso.

**Qué NO contiene:**

- Hooks de React.
- Estado. Los archivos exportan funciones puras async.
- Lógica de UI o Expo.
- **NUNCA** llamadas a Admin API, Customer Account API, ni a cualquier endpoint que no sea Storefront API.

**Regla de tipos:** toda función exportada devuelve **tipos de dominio**, no tipos crudos de Shopify. Si la query devuelve `{ edges: [{ node }] }`, un adaptador (`toDomainX`) lo transforma antes de salir.

**Regla de errores:** las mutations que devuelven `userErrors` **DEBEN** lanzar (`CartUserError` o equivalente) si `userErrors.length > 0`.

**Regla sobre `buyerIdentity`:** **PROHIBIDO** incluirlo en ninguna mutación de carrito. El carrito siempre es anónimo desde la app.

### `src/features/{feature}/`

**Qué contiene:** lo específico de un dominio de UI. Features actuales: `products`, `cart`, `checkout`, `auth`.

**Qué NO contiene:**

- Llamadas directas a `fetch` o `storefrontFetch`. Siempre vía funciones de `services/`.
- Tipos de dominio redefinidos. Se reimportan de `domain/`.
- Claves de storage hardcodeadas. Siempre `StorageKeys.X`.

**Regla de hooks:**

- Hook que lee datos remotos → `useQuery`.
- Hook que modifica datos remotos → `useMutation`.
- Toda mutación de carrito **DEBE** actualizar el cache de React Query (`setQueryData` o `invalidateQueries`).

**Regla específica de `features/auth/`:**

- **NO** contiene estado de usuario, `customerAccessToken`, ni datos de cliente.
- **NO** implementa pantallas de login, registro, o recuperación.
- Solo exporta hooks que abren URLs de Shopify con `expo-web-browser`.
- La URL base viene de `ENV.SHOPIFY_ACCOUNT_URL`, nunca hardcodeada.

### `src/providers/`

**Qué contiene:** composición de contextos globales (TanStack Query, Checkout Kit).

**Qué NO contiene:** lógica de negocio. Un provider es cableado, no inteligencia.

### `src/app/`

**Qué contiene:** rutas de Expo Router. Cada archivo es una screen o un layout.

**Regla:** los archivos en `app/` **DEBEN** ser delgados. Una screen importa un componente o hook de su feature y lo renderiza. Si una screen supera ~80 líneas, mueve lógica a un componente en `features/{X}/components/` o a un hook.

---

## 4. Flujos de trabajo: cómo hacer cambios comunes

### 4.1. Agregar una nueva query a Shopify

1. Si faltan campos en los fragments existentes, agrégalos en `services/shopify/fragments.ts`.
2. Crea el archivo en `services/shopify/queries/{recurso}.ts`.
3. Define la query GraphQL como string con `/* GraphQL */`.
4. Define el tipo `Raw*` (shape exacto de Shopify).
5. Define un adaptador `toDomainX(raw): DomainType`.
6. Exporta una función async `fetchX(...)` que usa `storefrontFetch` y devuelve el tipo de dominio.
7. Si el tipo de dominio no existe aún, créalo en `domain/`.

**NO** exportes el tipo `Raw*`. Se queda local al archivo.

### 4.2. Agregar una nueva mutation

Igual que query, pero en `services/shopify/mutations/`. Además:

- **DEBE** lanzar error si `userErrors.length > 0`.
- **DEBE** manejar el caso de carrito expirado (Shopify devuelve `cart: null`) lanzando `Error('CART_NOT_FOUND')` para que el hook decida qué hacer.
- **NO** incluir `buyerIdentity` en mutaciones de carrito.

### 4.3. Agregar un hook de feature

1. Nombre: `use{Accion}{Recurso}.ts` en `features/{recurso}/hooks/`.
2. Importa la función de `services/shopify/...`.
3. Envuelve en `useQuery` o `useMutation`.
4. Usa la query key desde `features/{recurso}/query-keys.ts`. Si no existe, agrégala primero.
5. En mutaciones, actualiza el cache con `setQueryData(queryKey, newData)`.

### 4.4. Agregar un tipo de dominio

1. Crea o edita el archivo en `domain/`.
2. El tipo **NO** debe incluir campos específicos de GraphQL.
3. Si necesitas enums de Shopify, importa solo los valores literales o defínelos de nuevo.

### 4.5. Agregar una screen

1. Crea archivo en `src/app/...` siguiendo la convención de Expo Router.
2. La screen **DEBE** ser un componente delgado: consume hooks y renderiza.
3. Si requiere estado complejo, extrae a `features/{X}/hooks/use-{screen}-controller.ts`.

### 4.6. Agregar una variable de entorno

1. Añade la var a `.env` y a `.env.example` si existe.
2. Añade su lectura tipada en `lib/env.ts` usando `required()`.
3. Consúmela **solo** vía `ENV.X`. Prohibido `process.env.X` directamente en el resto del código.
4. Si es sensible, añádela también al gestor de secretos del proveedor de build/deploy.

### 4.7. Agregar una acción hacia una página hospedada de Shopify

1. Añade un método nuevo a `features/auth/hooks/use-account-pages.ts`.
2. Usa `WebBrowser.openBrowserAsync(...)` con una URL construida a partir de `ENV.SHOPIFY_ACCOUNT_URL`.
3. **NO** hardcodees la URL base.
4. **NO** intentes procesar el resultado: `openBrowserAsync` resuelve cuando el usuario cierra el browser, pero no sabemos qué pasó dentro. Eso es por diseño.

### 4.8. Agregar una dependencia a `package.json`

No lo hagas sin justificarlo. Preguntas obligatorias antes:

- ¿Podemos resolver esto con lo que ya hay instalado?
- ¿Es una librería activa, mantenida, con tipos TS?
- ¿Cuánto pesa? (para móvil, cada KB cuenta)
- ¿Reemplaza algo que teníamos?

Si no hay respuestas claras, **NO** la instales; pregunta al humano.

---

## 5. Reglas de TypeScript

- **MUST:** `strict: true` en `tsconfig.json`. Nunca se relaja.
- **MUST:** cero `any` explícitos. Si necesitas uno, es señal de que falta un tipo.
- **MUST:** cero `@ts-ignore` y `@ts-expect-error` sin comentario explicando por qué y con un TODO.
- **MUST:** cero `as` casts excepto en adaptadores (`Raw → Domain`) y en límites de respuesta HTTP.
- **SHOULD:** preferir `type` sobre `interface` salvo que necesites declaration merging.
- **SHOULD:** tipos de retorno explícitos en funciones exportadas.

---

## 6. Estado: server vs. client

Esta es la confusión más común. Internalízala:

| Tipo de estado                | Ejemplos                                   | Herramienta    |
| ----------------------------- | ------------------------------------------ | -------------- |
| **Server state**              | Carrito, productos                         | TanStack Query |
| **Client state (compartido)** | Tema, modal abierto, filtros UI            | Zustand        |
| **Client state (local)**      | Valor de un input, toggle de un componente | `useState`     |

**Reglas:**

- **MUST:** datos que vienen de Shopify → **siempre** `useQuery` / `useMutation`.
- **MUST:** estado UI compartido entre pantallas → Zustand (un store por dominio, no un mega-store).
- **MUST NOT:** usar Context API para estado mutable global. Reservado para DI de servicios estáticos (Query Client, temas).
- **MUST NOT:** duplicar datos del carrito en un Zustand. El carrito vive en React Query. Zustand solo guarda UI sobre el carrito (ej. "el drawer está abierto").

---

## 7. Patrones prohibidos (antipatrones)

Lista negra de cosas que **NUNCA** deben aparecer en un PR:

1. **`fetch('https://...myshopify.com/...')`** fuera de `services/shopify/storefront.ts`.
2. **`SecureStore.getItemAsync('carrito')`** o similar — siempre vía `SecureStorage` + `StorageKeys`.
3. **`process.env.X`** fuera de `lib/env.ts`.
4. **Tipos con forma GraphQL en `domain/`** (`edges`, `node`, `PageInfo`).
5. **Hooks dentro de `services/`**.
6. **Imports de React/RN dentro de `domain/` o `services/`**.
7. **Imports circulares entre features**.
8. **Strings de query keys hardcodeadas** — siempre desde `query-keys.ts`.
9. **Mutaciones que no actualizan el cache** con `setQueryData` o `invalidateQueries`.
10. **Console.log dejado en el código.** Usar un logger o eliminar antes del commit.
11. **Hardcoded API version** (`/api/2025-10/...`) fuera de `lib/env.ts`.
12. **Llamadas al Admin API** — no existe en esta app.
13. **Llamadas al Customer Account API (OAuth)** — tampoco existen aquí.
14. **`any`, `@ts-ignore` sin TODO y justificación.**
15. **Widgets de checkout custom** — el checkout se presenta con Checkout Kit, no se reconstruye.
16. **Pantallas propias de login / registro / gestión de cuenta** — todo se delega a las páginas hospedadas de Shopify.
17. **Gestión de `customerAccessToken`** o cualquier token de cliente — no existe en esta app.
18. **`buyerIdentity` en mutaciones de carrito** — el carrito es siempre anónimo.
19. **URLs hardcodeadas a Shopify** — siempre desde `ENV`.
20. **Intentar compartir cookies de sesión entre `expo-web-browser` y Checkout Kit** — son WebViews distintos; no funciona y asumir que sí es un bug.

---

## 8. Seguridad

- **MUST NOT:** nunca loguear tokens ni IDs sensibles. Ni en `console.log`, ni en reportes de error, ni en analytics.
- **MUST:** `cartId` va en `expo-secure-store` vía `SecureStorage`.
- **MUST NOT:** nunca guardar tokens o `cartId` en AsyncStorage, memoria global, ni archivos.
- **MUST:** el token de Storefront va en `.env` + gestor de secretos del proveedor de build/deploy. Aunque es "público" por diseño, no hardcodearlo permite rotarlo sin tocar código.
- **MUST NOT:** instalar librerías de analytics o tracking sin discusión explícita con el equipo humano.

**Lo que delibradamente NO manejamos** (y está bien):

- Credenciales de cliente (email, password, códigos).
- Sesiones de cliente autenticado.
- Tokens de cliente (`customerAccessToken`).
- Información personal del cliente (direcciones, método de pago, historial).

Todo lo anterior vive en Shopify. La app no lo ve, no lo guarda, no lo procesa.

---

## 9. Manejo de errores

**Niveles:**

1. **Error de red / HTTP** → `StorefrontError` (ya definido). Bubble up.
2. **Error de usuario de Shopify** (`userErrors` en mutation) → `CartUserError`. Mostrar mensaje al usuario.
3. **Carrito expirado** → `Error('CART_NOT_FOUND')`. El hook debe manejarlo (crear nuevo carrito).
4. **Error de validación local (zod)** → fallar loud en dev, log silencioso en prod.

**Regla general:** nunca atrapes un error sin hacer algo con él. `catch (err) {}` vacío es un bug.

---

## 10. Reglas sobre el carrito específicamente

- **MUST:** el `cartId` vive solo en `SecureStorage` con la clave `StorageKeys.CART_ID`.
- **MUST:** `useCart()` es la única forma de leer el carrito. No leer `cartId` directamente en componentes.
- **MUST:** `useAddToCart()` maneja los tres casos: no-existe, expirado, válido. No duplicar esta lógica.
- **MUST:** el carrito creado por la app es **siempre anónimo**. Nunca con `buyerIdentity`.
- **MUST:** tras un checkout completado, limpiar `cartId` e invalidar `cartKeys.all`. Esto vive en `CheckoutProvider`.
- **MUST NOT:** hacer polling del carrito. React Query refetcha cuando hace falta.
- **SHOULD:** evitar optimistic updates en la primera iteración. Agregarlos solo cuando el flujo básico esté estable.

---

## 11. Checkout: reglas inviolables

- **MUST:** usar `@shopify/checkout-sheet-kit`. No embebemos checkout en un WebView custom.
- **MUST:** el `checkoutUrl` viene de Shopify (de `cartCreate` o `cartAttributesUpdate`). No se construye a mano.
- **MUST NOT:** intentar procesar pagos dentro de la app. Todo el flujo de pago es responsabilidad del checkout de Shopify.
- **MUST NOT:** scrappear o leer el DOM del checkout. Es una caja negra por diseño.
- **MUST NOT:** intentar "pasar" el cliente autenticado al checkout. Si el usuario quiere autenticarse ahí, lo hace dentro del propio checkout; la app no participa.

---

## 12. Auth / Cuenta de usuario: reglas inviolables

- **MUST:** toda UI de cuenta se delega a `expo-web-browser` abriendo URLs de `ENV.SHOPIFY_ACCOUNT_URL`.
- **MUST NOT:** implementar pantallas de login, registro, recuperación, cambio de contraseña, o edición de perfil en la app.
- **MUST NOT:** intentar parsear el resultado de `openBrowserAsync` para inferir si el usuario se autenticó. No lo sabemos; no lo necesitamos.
- **MUST NOT:** mostrar nombre, email, o cualquier dato del cliente en la app. La app no conoce al cliente.
- **MUST NOT:** agregar funcionalidades que requieran saber quién es el cliente (saludos personalizados, badges de pedidos, recomendaciones in-app basadas en historial). Si esas features son requeridas, escalar al equipo humano para migrar a Opción B (backend ligero con Customer Account API).

---

## 13. Testing (cuando se añada)

- **Capa `domain/`:** tests unitarios puros (Vitest / Jest). Rápidos porque no hay React ni red.
- **Capa `services/`:** tests con mock de `fetch`. Validar que los adaptadores transforman correctamente.
- **Hooks de `features/`:** tests con `@testing-library/react-native` y `QueryClientProvider` de test.
- **Screens / integración:** solo las críticas (agregar al carrito, checkout).

**No se exige cobertura mínima,** pero cualquier bug arreglado **DEBE** venir con un test de regresión.

---

## 14. Convenciones de naming

| Cosa                 | Convención           | Ejemplo                           |
| -------------------- | -------------------- | --------------------------------- |
| Archivos TS/TSX      | `kebab-case`         | `use-cart.ts`, `product-card.tsx` |
| Componentes React    | `PascalCase`         | `ProductCard`, `CartDrawer`       |
| Hooks                | `useXxx` (camelCase) | `useCart`, `useAddToCart`         |
| Tipos / interfaces   | `PascalCase`         | `Product`, `CartLine`             |
| Constantes           | `UPPER_SNAKE_CASE`   | `ENV`, `StorageKeys`              |
| Funciones            | `camelCase` verbales | `fetchCart`, `formatMoney`        |
| Query keys factories | `xxxKeys`            | `cartKeys`, `productKeys`         |

---

## 15. Checklist antes de cerrar un cambio

- [ ] No hay imports que violen la tabla de dependencias (sección 2).
- [ ] No hay `any`, `@ts-ignore` sin TODO, ni strings hardcodeadas que deberían estar en constantes.
- [ ] Si tocaste tipos de Shopify, el adaptador `toDomain*` sigue correcto.
- [ ] Si agregaste una mutation, actualiza el cache (`setQueryData` o `invalidateQueries`).
- [ ] Si agregaste una query key, está en `features/*/query-keys.ts`.
- [ ] Si agregaste una env var, está en `lib/env.ts` y en `.env.example`.
- [ ] No agregaste `buyerIdentity` a ninguna mutación de carrito.
- [ ] No implementaste UI de cuenta propia (todo va a `expo-web-browser`).
- [ ] No hay `console.log` de debug dejados.
- [ ] No hay imports sin usar.
- [ ] `tsc --noEmit` pasa limpio.
- [ ] La app arranca (no rompiste `_layout.tsx`).
- [ ] Si tocaste el flujo de carrito, probaste: primer add (sin carrito), segundo add, add con carrito expirado.

---

## 16. Cuándo preguntar vs. cuándo proceder

**PROCEDE sin preguntar** si:

- El cambio encaja limpio en los patrones documentados.
- No necesita dependencias nuevas.
- No cambia la dirección de dependencias.
- No toca seguridad, checkout, ni auth.

**PREGUNTA al humano** si:

- Necesitas instalar una dependencia nueva.
- El cambio requiere romper alguna regla **MUST** (siempre con justificación).
- La tarea requiere introducir una nueva capa o carpeta no listada.
- La tarea implica datos personales del cliente o compliance.
- Detectas una ambigüedad en estas reglas.
- **El requerimiento exige saber quién es el cliente en la app** (saludo, personalización in-app, badges). Esto es signal fuerte de que se necesita Opción B; escalar.

**ALERTA y detente** si:

- Encuentras código que ya viola reglas **MUST**. Repórtalo en vez de ampliarlo.
- Encuentras tokens o secrets hardcodeados. Repórtalo inmediatamente, no los uses, no los commitees de nuevo.
- Encuentras código que gestiona `customerAccessToken` o llama a Admin/Customer Account API. Es contrario al modelo; escalar antes de tocar.

---

## 17. Evolución de este documento

Este archivo no es estático. Si en el curso de un cambio descubres:

- Una regla que falta.
- Una regla que ya no aplica.
- Un patrón nuevo que deberías codificar.

**Propón una edición a `ARCHITECTURE.md` en el mismo PR.** No lo cambies silenciosamente.

---

## Apéndice A — Glosario rápido

- **Storefront API:** GraphQL público de Shopify para catálogo, carrito y productos. Usamos esto desde la app.
- **Admin API:** GraphQL privado de Shopify para gestión. **NO** usamos esto.
- **Customer Account API:** auth moderna de Shopify con OAuth. **NO** usamos esto (requeriría backend).
- **Customer Accounts (páginas hospedadas):** URLs de Shopify donde el cliente maneja su cuenta. Usamos esto via `expo-web-browser`.
- **Checkout Kit:** SDK nativo para embeber checkout de Shopify. `@shopify/checkout-sheet-kit`.
- **Storefront Token:** token público de bajo privilegio. Va en env, aceptable exponerlo al cliente.
- **Admin Token:** token privado de alto privilegio. **NUNCA** va en la app.
- **Cart anónimo:** carrito sin `buyerIdentity`. Es el único tipo que creamos.
- **`cartId`:** ID del carrito en Storefront API. Vive en `expo-secure-store`.

---

## Apéndice B — Referencia rápida de reglas inviolables

1. Toda llamada a Shopify pasa por `services/shopify/storefront.ts`.
2. `domain/` es puro: sin React, sin fetch, sin SDKs.
3. Server state → TanStack Query. Client state compartido → Zustand.
4. `cartId` → `SecureStorage` con `StorageKeys`.
5. Env vars → solo vía `lib/env.ts`.
6. Nunca Admin API ni Customer Account API desde la app.
7. Nunca loguear secretos.
8. Nunca tipos GraphQL crudos en `domain/`.
9. Nunca romper la dirección de dependencias (sección 2).
10. Checkout se abre con Checkout Kit, nunca se reconstruye.
11. Auth/cuenta se delega a `expo-web-browser` con `ENV.SHOPIFY_ACCOUNT_URL`.
12. Carritos creados desde la app son siempre anónimos (sin `buyerIdentity`).
13. La app no conoce al cliente autenticado. Si un requisito lo necesita, escalar.
