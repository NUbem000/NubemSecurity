# 🖥️ NubemSecurity CLI - Guía de Uso

## ✅ Estado del CLI

**SÍ, el CLI está completamente habilitado y funcional para NubemSecurity.**

## 🚀 Instalación y Configuración

### Instalación Local
```bash
cd /home/david/NubemSecurity
npm install
npm link  # Hace disponible el comando 'nubemsec' globalmente
```

### Verificar Instalación
```bash
# Ver ayuda del CLI
nubemsec --help

# Ver versión
nubemsec --version
```

## 💻 Modos de Uso

### 1. Modo CLI Interactivo (Chat con IA)
```bash
# Iniciar modo interactivo
nubemsec

# Con proveedor específico
nubemsec --provider openai
nubemsec --provider gemini

# Modo offline (respuestas en caché)
nubemsec --offline
```

#### Comandos Disponibles en Modo Interactivo:
- `/help` - Muestra comandos disponibles
- `/tools` - Lista herramientas de seguridad
- `/clear` - Limpia la pantalla
- `/reset` - Reinicia el historial de conversación
- `/exit` o `/quit` - Salir del CLI

### 2. Modo Servidor (API REST)
```bash
# Iniciar servidor de producción
nubemsec --server

# O usando npm
npm start
```

El servidor se ejecutará en `http://localhost:8080` con:
- Autenticación JWT
- Rate limiting
- Headers de seguridad
- API RESTful completa

### 3. Modo Web (Interfaz Browser)
```bash
# Abrir interfaz web en el navegador
nubemsec --web
```

Abre automáticamente: `https://nubemsecurity-app-313818478262.us-central1.run.app`

## 🔧 Configuración de API Keys

### Opción 1: Variables de Entorno (.env)
```bash
# Crear archivo .env
cat > .env << EOF
OPENAI_API_KEY=tu_clave_openai
GOOGLE_API_KEY=tu_clave_gemini
DEFAULT_PROVIDER=openai
EOF
```

### Opción 2: Configuración Interactiva
```bash
nubemsec
# El CLI te pedirá la API key en el primer uso
```

## 📝 Ejemplos de Uso

### Consultas de Seguridad
```bash
# Iniciar CLI
nubemsec

# Ejemplos de preguntas:
> How to use nmap for port scanning?
> Explain SQL injection attacks
> Best practices for password security
> How to detect XSS vulnerabilities
```

### Trabajar con Herramientas
```bash
# Ver herramientas disponibles
/tools

# Preguntar sobre herramientas específicas
> How to use metasploit for exploitation?
> Explain burpsuite proxy configuration
> John the ripper command examples
```

## 🐛 Solución de Problemas

### Error: Comando no encontrado
```bash
# Asegurarse de que está instalado
cd /home/david/NubemSecurity
npm link

# Verificar que el archivo es ejecutable
chmod +x nubemsec
```

### Error: No API key
```bash
# Configurar API key
export OPENAI_API_KEY="tu_clave_aqui"

# O crear archivo .env
echo "OPENAI_API_KEY=tu_clave_aqui" > .env
```

### Error: Módulos no encontrados
```bash
# Reinstalar dependencias
npm install --legacy-peer-deps
```

## 🔍 Estado Actual del Sistema

### ✅ Componentes Funcionando:
1. **CLI Interactivo** - Chat con IA para consultas de seguridad
2. **Servidor API** - REST API con autenticación JWT
3. **Web Interface** - Acceso via navegador
4. **Integración con Herramientas** - 50+ herramientas de seguridad
5. **Multi-provider** - Soporte para OpenAI, Gemini, Grok, DeepSeek

### 📦 Archivos Clave del CLI:
- `/home/david/NubemSecurity/nubemsec` - Ejecutable principal
- `/home/david/NubemSecurity/src/index.js` - CLI interactivo
- `/home/david/NubemSecurity/src/server.js` - Servidor API
- `/home/david/NubemSecurity/package.json` - Configuración npm

## 🎯 Prueba Rápida

```bash
# 1. Ir al directorio
cd /home/david/NubemSecurity

# 2. Instalar si no está instalado
npm install --legacy-peer-deps

# 3. Hacer disponible globalmente
npm link

# 4. Probar CLI
nubemsec --help

# 5. Iniciar modo interactivo
nubemsec

# 6. Hacer una pregunta de seguridad
> What is SQL injection and how to prevent it?

# 7. Salir
/exit
```

## ✨ Características Avanzadas

### RAG (Retrieval Augmented Generation)
- Vector store para conocimiento contextual
- Base de datos de herramientas de seguridad
- Respuestas mejoradas con contexto

### Seguridad
- Autenticación JWT
- Rate limiting
- Validación de inputs
- Headers de seguridad

### Escalabilidad
- Desplegado en Google Cloud Run
- Auto-scaling 1-100 instancias
- Cache de respuestas

---

**El CLI está 100% funcional y listo para usar.** 🚀