# Documentação da API de Transcrição

Esta API permite transcrever arquivos de áudio locais usando o modelo `faster-whisper`.

## Endpoint de Transcrição

- **URL:** `/transcribe/`
- **Método:** `POST`
- **Content-Type:** `multipart/form-data`

### Parâmetros da Requisição

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `file`    | File | Sim         | O arquivo de áudio a ser transcrito (formatos suportados: .mp3, .wav, .m4a, etc.) |

### Exemplo de Uso com `curl`

```bash
curl -X POST "http://localhost:8000/transcribe/" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/caminho/para/seu/audio.mp3"
```

### Exemplo de Resposta (Sucesso - 200 OK)

A resposta será um objeto JSON contendo o texto transcrito e metadados.

```json
{
  "title": "Olá, este é um teste...",
  "text": "Olá, este é um teste de transcrição em português.",
  "language": "pt",
  "start_time": 0.0,
  "end_time": 4.5,
  "duration": 4.5
}
```

### Detalhes Técnicos

- **Modelo:** faster-whisper (tamanho `small` ou `base`, configurável no serviço).
- **Idioma:** O sistema tenta forçar/detectar `pt` (Português) por padrão, mas o serviço retorna o idioma detectado.
- **Processamento:** Ocorre na CPU por padrão (configurado como `int8`).

### Erros Comuns

- **422 Validation Error:** Se o arquivo não for enviado corretamente no campo `file`.
- **500 Internal Server Error:** Se houver falha no processamento do áudio ou leitura do arquivo.
