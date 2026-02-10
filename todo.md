# Web Financiera: TODO List

## Fase 1: Diseño de Base de Datos y Modelos

- [x] Crear tabla `portfolios` para almacenar portafolios de usuarios
- [x] Crear tabla `investments` para operaciones de inversión (compras, ventas, dividendos)
- [x] Crear tabla `portfolio_assets` para activos dentro de cada portafolio
- [x] Crear tabla `monte_carlo_simulations` para almacenar resultados de simulaciones
- [x] Crear tabla `recommendations` para recomendaciones personalizadas
- [x] Crear tabla `portfolio_reports` para reportes PDF generados
- [x] Crear tabla `notifications` para notificaciones del sistema

## Fase 2: Backend - APIs y Lógica de Negocio

- [x] Implementar API CRUD para portafolios
- [x] Implementar API CRUD para operaciones de inversión
- [x] Implementar API para calcular métricas financieras (retorno, volatilidad, Sharpe ratio, VaR)
- [x] Implementar API para análisis de diversificación
- [x] Implementar servicio de simulación de Monte Carlo
- [x] Implementar servicio de generación de recomendaciones personalizadas
- [x] Implementar servicio de generación de análisis narrativos con LLM
- [x] Implementar servicio de generación de reportes PDF
- [ ] Implementar sistema de notificaciones automáticas
- [ ] Implementar API para obtener datos históricos de activos (integración con yfinance)
- [ ] Implementar API para gestión de perfiles de riesgo
- [x] Crear endpoint para ejecutar simulación de Monte Carlo
- [x] Guardar resultados de simulación en base de datos
- [x] Integrar ejecución en frontend
- [x] Crear interfaz de personalización de portafolio por defecto
- [x] Permitir ajuste de pesos de activos
- [x] Permitir ajuste de retornos esperados
- [x] Permitir ajuste de volatilidades

## Fase 3: Frontend - Interfaz de Usuario

- [x] Crear layout base con navegación y sidebar (DashboardLayout)
- [x] Crear página de inicio (Home.tsx)
- [x] Crear página de dashboard principal con resumen de portafolio (Dashboard.tsx)
- [x] Crear página de detalles del portafolio con gestión de operaciones (PortfolioDetail.tsx)
- [x] Crear página de análisis de riesgo y simulación de Monte Carlo (SimulationAnalysis.tsx)
- [x] Crear página de recomendaciones personalizadas (Recommendations.tsx)
- [x] Crear página de análisis de diversificación
- [x] Crear componente de matriz de correlación
- [x] Crear componente de heatmap interactivo
- [x] Crear componente de análisis de concentración
- [ ] Crear página de visualización de reportes históricos
- [x] Crear página de historial de simulaciones
- [x] Crear componente de gráfico de evolución de métricas
- [ ] Crear componente de comparación de simulaciones
- [ ] Crear componentes de gráficos interactivos (Recharts)
- [ ] Integrar visualización de resultados de simulación
- [x] Agregar tooltips informativos en comparador
- [x] Agregar animaciones en gráficos
- [x] Crear guía educativa de métricas
- [x] Crear dashboard de comparación de portafolios
- [x] Crear componente de selección de portafolios
- [x] Crear componente de comparación de métricas
- [x] Crear gráficos comparativos de riesgo-retorno
- [x] Crear componente de histograma de distribuciones
- [x] Crear componente de gráfico de densidad de probabilidad
- [x] Crear componente de curva de distribución acumulativa
- [x] Crear componente de análisis de percentiles
- [x] Integrar gráficos en página de simulación

## Fase 4: Algoritmo de Simulación de Monte Carlo

- [x] Implementar algoritmo de simulación de Monte Carlo en backend
- [x] Implementar cálculo de distribuciones de probabilidades
- [x] Implementar análisis de proyecciones de portafolio
- [x] Implementar cálculo de VaR (Value at Risk)
- [x] Implementar cálculo de Sharpe ratio
- [ ] Implementar análisis de sensibilidad

## Fase 5: Sistema de Recomendaciones

- [x] Implementar lógica de recomendaciones basada en perfil de riesgo
- [x] Implementar detección de oportunidades de rebalanceo
- [x] Implementar alertas de riesgo basadas en simulaciones
- [x] Implementar análisis narrativos con LLM
- [x] Implementar sistema de explicaciones personalizadas

## Fase 6: Generación de Reportes y Notificaciones

- [x] Implementar generación de reportes HTML
- [x] Implementar almacenamiento de reportes en S3
- [ ] Implementar sistema de notificaciones por email
- [ ] Implementar notificaciones en la aplicación
- [ ] Implementar alertas automáticas de rebalanceo
- [ ] Implementar alertas de cambios significativos en portafolio

## Fase 7: Análisis de Escenarios de Mercado

- [x] Crear tabla de escenarios de mercado en base de datos
- [x] Crear tabla de eventos de mercado predefinidos
- [x] Crear servicio de análisis de escenarios en backend
- [x] Crear página de herramienta de análisis de escenarios
- [x] Crear componente de constructor de escenarios
- [x] Crear componente de visualización de impacto de escenarios
- [x] Implementar comparación de múltiples escenarios
- [x] Agregar escenarios predefinidos (crash, inflación, recesión, etc.)
- [x] Crear gráficos de sensibilidad de portafolio
- [ ] Integrar análisis de escenarios con simulaciones de Monte Carlo
- [x] Crear sección de resumen ejecutivo
- [x] Agregar métricas clave de escenarios
- [x] Crear recomendaciones basadas en análisis
- [x] Agregar análisis de peor y mejor caso
- [x] Crear indicador de resiliencia del portafolio

## Fase 8: Pruebas y Validación

- [ ] Escribir tests unitarios para servicios de cálculo
- [ ] Escribir tests para API de portafolios
- [ ] Escribir tests para API de operaciones
- [ ] Escribir tests para simulación de Monte Carlo
- [ ] Escribir tests para generación de recomendaciones
- [ ] Realizar pruebas de integración
- [ ] Realizar pruebas de rendimiento del algoritmo

## Fase 8: Entrega y Documentación

- [ ] Documentar APIs
- [ ] Crear guía de usuario
- [ ] Realizar checkpoint final
- [ ] Entregar aplicación al usuario


## Fase 9: Herramienta de Backtesting Histórico

- [x] Crear tabla de eventos históricos en base de datos
- [x] Crear tabla de datos de backtesting
- [x] Crear servicio de backtesting en backend
- [x] Crear página de herramienta de backtesting
- [x] Agregar eventos históricos predefinidos (crisis 2008, COVID-19, crash 2020, etc.)
- [x] Crear componente de selector de período histórico
- [x] Crear componente de visualización de resultados de backtesting
- [x] Implementar gráficos de evolución histórica
- [x] Agregar métricas de desempeño histórico
- [x] Crear comparación de estrategias alternativas
- [x] Agregar análisis de máxima pérdida histórica
- [ ] Integrar backtesting con portafolios actuales


## Fase 10: Integración de Noticias del Mercado en Tiempo Real

- [x] Crear servicio de obtención de noticias del mercado
- [x] Integrar API de noticias financieras
- [x] Crear componente de feed de noticias
- [x] Agregar filtros de noticias por categoría
- [x] Crear sección de noticias en dashboard
- [ ] Integrar noticias con backtesting
- [ ] Agregar contexto histórico de eventos
- [ ] Crear alertas de noticias importantes


## Fase 11: Integración de NewsAPI Real

- [x] Crear servicio newsApiService.ts para obtener noticias de NewsAPI
- [x] Validar clave API de NewsAPI en ENV
- [x] Reemplazar datos simulados con API real
- [x] Agregar filtros de búsqueda por palabra clave
- [ ] Implementar caché de noticias
- [ ] Crear pruebas de integración con NewsAPI
- [ ] Agregar endpoint en router para obtener noticias
- [ ] Integrar noticias con análisis de portafolio


## Fase 12: Análisis de Sentimiento Avanzado

- [x] Crear servicio de análisis de sentimiento NLP
- [x] Implementar correlación sentimiento-movimientos históricos
- [x] Crear matriz de impacto de sentimiento por activo
- [x] Integrar sentimiento en predicciones de Monte Carlo
- [x] Crear visualización de sentimiento de mercado
- [x] Agregar indicador de confianza de predicciones
- [ ] Crear alertas basadas en cambios de sentimiento
- [x] Crear tabla sentimentAnalysis en base de datos
- [x] Crear servicio sentimentAnalysisService.ts
- [x] Crear funciones de integración con LLM y NewsAPI
- [x] Crear router tRPC para análisis de sentimiento
- [x] Crear componente SentimentAnalysisDisplay.tsx
- [x] Crear página SentimentAnalysisPage.tsx
- [x] Integrar análisis de sentimiento en Monte Carlo
- [x] Crear pruebas unitarias para servicios


## Fase 13: Sistema de Caché para Análisis de Sentimiento

- [x] Crear tabla sentimentAnalysisCache en base de datos
- [x] Implementar servicio de caché en memoria con TTL
- [x] Integrar caché en endpoints tRPC de análisis
- [x] Crear estrategia de invalidación de caché
- [x] Implementar limpieza automática de caché expirado
- [x] Crear pruebas unitarias para servicio de caché
- [x] Crear servicio de invalidación de caché
- [x] Crear pruebas unitarias para invalidación
- [x] Todas las pruebas pasando (58 tests)


## Fase 14: Integración de Invalidación Automática de Caché en CRUD

- [x] Integrar invalidación en operaciones de portafolio (crear, actualizar, eliminar)
- [x] Integrar invalidación en operaciones de inversiones (crear, actualizar, eliminar)
- [x] Integrar invalidación en operaciones de activos (crear, actualizar, eliminar)
- [x] Crear wrapper para operaciones CRUD con invalidación automática
- [x] Escribir pruebas de integración para invalidación en CRUD
- [x] Validar que caché se invalida correctamente en todas las operaciones
- [x] Integrar invalidación en endpoint de crear portafolio
- [x] Integrar invalidación en endpoint de crear inversión
- [x] Todas las pruebas pasando (68 tests)


## Fase 15: Implementación de Endpoints CRUD Completos

- [x] Implementar endpoint portfolio.update
- [x] Implementar endpoint portfolio.delete
- [x] Implementar endpoint investment.update
- [x] Implementar endpoint investment.delete
- [x] Agregar funciones updatePortfolio y deletePortfolio a db.ts
- [x] Agregar funciones updateInvestment y deleteInvestment a db.ts
- [x] Escribir pruebas de integración para endpoints CRUD
- [x] Validar que todos los endpoints funcionan correctamente
- [x] Todas las pruebas pasando (83 tests)


## Fase 16: Componentes Frontend para Edición de Portafolios e Inversiones

- [x] Crear componente EditPortfolioDialog
- [x] Crear componente DeletePortfolioDialog
- [x] Crear componente EditInvestmentDialog
- [x] Crear componente DeleteInvestmentDialog
- [x] Integrar componentes en página de portafolios (PortfoliosPage.tsx)
- [x] Integrar componentes en página de inversiones (InvestmentsPage.tsx)
- [x] Probar edición de portafolios
- [x] Probar edición de inversiones
- [x] Probar eliminación de portafolios
- [x] Probar eliminación de inversiones
- [x] Validación de formularios con Zod
- [x] Integración completa con endpoints tRPC


## Fase 17: Sistema de Notificaciones Toast

- [x] Instalar librería sonner
- [x] Crear componente ToastProvider
- [x] Crear hook useToast
- [x] Agregar notificaciones en EditPortfolioDialog
- [x] Agregar notificaciones en DeletePortfolioDialog
- [x] Agregar notificaciones en EditInvestmentDialog
- [x] Agregar notificaciones en DeleteInvestmentDialog
- [x] Integrar ToastProvider en main.tsx
- [x] Probar notificaciones de éxito
- [x] Probar notificaciones de error
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 19: Página de Perfil de Usuario

- [x] Agregar campo profilePicture a tabla users
- [x] Ejecutar migración de base de datos
- [x] Actualizar servicio de Google OAuth para guardar foto
- [x] Crear componente UserProfileCard
- [x] Crear página ProfilePage
- [x] Agregar ruta /profile en App.tsx
- [x] Crear pruebas unitarias para perfil
- [x] Todas las pruebas pasando (83 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 20: Formulario de Edición de Perfil

- [x] Crear función updateUserProfile en db.ts
- [x] Crear endpoint tRPC auth.updateProfile
- [x] Crear componente EditProfileDialog
- [x] Agregar validación con Zod
- [x] Integrar diálogo en ProfilePage
- [x] Agregar notificaciones toast
- [x] Crear pruebas unitarias (10 tests)
- [x] Probar edición de nombre
- [x] Probar edición de perfil de riesgo
- [x] Todas las pruebas pasando (93 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 21: Historial de Sesiones Activas

- [x] Crear tabla userSessions en base de datos
- [x] Ejecutar migración de base de datos
- [x] Crear funciones de gestión de sesiones en db.ts
- [x] Crear endpoints tRPC para listar y cerrar sesiones
- [x] Crear componente SessionHistoryCard
- [x] Integrar en ProfilePage
- [x] Agregar detección de dispositivo/navegador
- [x] Crear pruebas unitarias
- [x] Probar listado de sesiones
- [x] Probar cierre de sesión remota
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 22: Animación de Carga para Historial de Sesiones

- [x] Agregar estado isLoading en SessionHistoryCard
- [x] Crear componente skeleton para tabla de sesiones
- [x] Implementar animación de carga con Tailwind CSS
- [x] Mostrar skeleton mientras se cargan los datos
- [x] Probar animación en diferentes velocidades de red
- [x] Validar experiencia visual
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 23: Análisis Avanzado de Monte Carlo

- [x] Revisar implementación actual de Monte Carlo
- [x] Validar algoritmo y cálculos de simulación
- [x] Crear componente MonteCarloSummary con resumen ejecutivo
- [x] Crear componente SimulationPathsChart para visualizar caminos
- [x] Crear componente SensitivityAnalysis para análisis de sensibilidad
- [x] Integrar nuevos componentes en SimulationAnalysis
- [x] Corregir errores de TypeScript
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 24: Exportación de Informes PDF de Monte Carlo

- [x] Crear servicio backend para generar PDF
- [x] Implementar endpoint tRPC para exportación
- [x] Crear componente de botón de descarga
- [x] Integrar en página de análisis
- [x] Escribir pruebas unitarias
- [x] Validar generación de PDF
- [x] Probar descarga de archivos
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 25: Personalización de Informes PDF

- [x] Crear diálogo de selección de secciones
- [x] Actualizar servicio de generación de PDF
- [x] Agregar parámetros de secciones al endpoint
- [x] Integrar diálogo en componente ExportSimulationPDF
- [x] Escribir pruebas unitarias
- [x] Validar generación de PDFs personalizados
- [x] Probar todas las combinaciones de secciones
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Bugs Reportados

- [x] Corregir error "Rendered more hooks than during the previous render" en PortfolioComparator
  - Error en página /compare
  - Causa: Orden inconsistente de hooks (useContext en posición 18 en segundo render)
  - Solución: Refactorizar para cumplir Rules of Hooks
  - Cambios: Usar useQuery con enabled en lugar de condicionales, mover lógica a useEffect


## Fase 26: Historial de Cambios y Evolución de Portafolios

- [x] Crear tabla portfolioHistory en base de datos
- [x] Ejecutar migración de base de datos
- [x] Crear funciones de registro de cambios en db.ts
- [x] Crear endpoints tRPC para obtener historial
- [x] Crear componente PortfolioHistoryTimeline
- [x] Crear componente EvolutionChart con gráficos de tendencias
- [x] Integrar en página de detalles de portafolio
- [x] Agregar registro automático de cambios
- [x] Crear pruebas unitarias
- [x] Validar visualización de historial
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores


## Fase 27: Exportación de Historial de Portafolios

- [x] Crear servicio de exportación CSV
- [x] Crear servicio de exportación PDF
- [x] Implementar endpoints tRPC para exportación
- [x] Crear componente de botones de descarga
- [x] Integrar en página de detalles
- [x] Escribir pruebas unitarias
- [x] Validar generación de archivos
- [x] Todas las pruebas pasando (99 tests)
- [x] Cero errores de TypeScript
- [x] Servidor de desarrollo corriendo sin errores
