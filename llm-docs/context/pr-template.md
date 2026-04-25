# [nombre-de-la-rama] Título del Pull Request

## 📋 Descripción del Cambio

**Rama:** `nombre-de-la-rama`

_(Breve descripción de qué se implementó o corrigió. Menciona los problemas que resuelve o las mejoras que introduce)._

### Key Features

- Punto 1
- Punto 2
- Punto 3

---

## ✅ Definición de Hecho (Definition of Done)

- [ ] **Typecheck exitoso:** ¿Pasó `npm run typecheck`?
- [ ] **Lint exitoso:** ¿Pasó `npm run lint`?
- [ ] **Formato correcto:** ¿Pasó `npm run format:check`?
- [ ] **Export web exitoso:** ¿Pasó `npx expo export --platform web` si el cambio puede afectar bundling/routing?
- [ ] **App levanta correctamente:** ¿Se verificó en Expo/Android/iOS/Web según aplique?
- [ ] **Sin regresiones visibles:** ¿Se revisó que no haya errores nuevos en Metro, consola o logs relevantes?
- [ ] **Arquitectura respetada:** ¿El cambio mantiene la separación `app -> features -> services -> domain`?
- [ ] **Sin dependencias innecesarias:** ¿No se instalaron paquetes nuevos sin justificación?

---

## 🛍️ Checklist Shopify / Storefront API

Completar solo si el PR toca datos o integración con Shopify.

- [ ] **Storefront API:** ¿Todas las llamadas pasan por `src/services/shopify/storefront.ts`?
- [ ] **Sin APIs prohibidas:** ¿No se usó Admin API, Customer Account API/OAuth, backend propio ni `buyerIdentity`?
- [ ] **Variables de entorno:** ¿Las variables necesarias están en `.env.example` y se consumen vía `src/lib/env.ts`?
- [ ] **Validación de payloads:** ¿Los payloads externos se validan con Zod en la capa de `services/`?
- [ ] **Shopify Admin:** ¿Se documentó si requiere cambios en metaobjects, colecciones, productos, permisos o publicación?
- [ ] **Scope Storefront:** ¿Se confirmó el scope necesario del token si aplica? Ej. `unauthenticated_read_metaobjects`.

---

## 🎨 Checklist UI / UX

Completar si el PR afecta componentes visuales.

- [ ] **Diseño consistente:** ¿Respeta `llm-docs/design/DESIGN.md` y la identidad Luminous Commerce?
- [ ] **Tokens Uniwind:** ¿Usa tokens de `src/global.css` cuando aplica (`bg-canvas`, `text-heading`, `bg-primary`, etc.)?
- [ ] **Light/Dark mode:** ¿El cambio funciona en modo claro y oscuro?
- [ ] **Accesibilidad:** ¿Los elementos interactivos tienen `accessibilityRole`, `accessibilityLabel` o props equivalentes cuando aplica?
- [ ] **Imágenes:** ¿Las imágenes remotas usan `expo-image` y tienen dimensiones/render confiable?

---

## 🧪 Pasos para validar QA

Describe detalladamente cómo QA debe probar estos cambios.

1. **Prueba 1:** Paso a paso de lo que se debe hacer.
   - **Resultado esperado:** Qué se debe observar.
2. **Prueba 2:** Paso a paso de lo que se debe hacer.
   - **Resultado esperado:** Qué se debe observar.
3. **Casos de borde:** Escenarios que podrían fallar o requieren atención especial.

---

## 📸 Capturas de Pantalla / Video (Opcional)

_(Adjunta evidencia visual, links a Loom o archivos si el cambio afecta la UI)._

---

## 🛠️ Detalles Técnicos

- **Archivos o módulos clave:**
  - `ruta/al/archivo.ts` — descripción breve.
- **Dependencias:** ¿Se instaló algo nuevo? Si sí, justificar.
- **Cambios en Shopify Admin:** ¿Requiere metaobjects, campos, colecciones, permisos o contenido publicado?
- **Ambiente de pruebas:** Local / Expo Go / Dev Client / Android / iOS / Web.

---

## 📝 Notas adicionales

Cualquier información extra relevante para el revisor o QA.
