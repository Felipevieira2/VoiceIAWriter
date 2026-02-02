# VoiceIAWriter Backend

Este é o backend do projeto VoiceIAWriter, responsável pela transcrição de áudio utilizando o modelo `faster-whisper` com FastAPI.

## 🚀 Como Executar com Docker

Siga os passos abaixo para construir e executar o serviço de transcrição isolado em um container.

### 1. Construir a Imagem Docker

Na pasta `backend` (onde este arquivo está localizado), execute:

```bash
docker build -t voice-ia-writer-backend .
```

### 2. Rodar o Container

Execute o container expondo a porta 8000:

```bash
docker run -d -p 8000:8000 --name voice-backend voice-ia-writer-backend
```

O serviço estará disponível em `http://localhost:8000`.
A documentação interativa (Swagger UI) pode ser acessada em `http://localhost:8000/docs`.

---

## 🧪 Testando a API

Você pode testar o endpoint de transcrição utilizando o `curl`. Supondo que você tenha um arquivo chamado `teste.mp3` na pasta atual:

```bash
curl -X POST "http://localhost:8000/transcribe/" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@teste.mp3"
```

> **Nota:** Certifique-se de que o caminho para o arquivo (`@teste.mp3`) esteja correto no seu terminal.

---

## ⚙️ Alterando o Tamanho do Modelo (Configuração)

Por padrão, o serviço utiliza o modelo `small` rodando em CPU (`int8`), otimizado para um equilíbrio entre velocidade e precisão em máquinas comuns.

Se você tiver mais hardware disponível (mais memória RAM ou GPU) e quiser maior precisão, você pode alterar o tamanho do modelo para `medium` ou `large-v2`.

1. Abra o arquivo: `app/services/transcription_service.py`
2. Localize o construtor da classe `TranscriptionService`:

```python
class TranscriptionService:
    def __init__(self, model_size: str = "small", device: str = "cpu", compute_type: str = "int8"):
        # ...
```

3. Altere o valor padrão de `model_size`:
   - `'tiny'`: Muito rápido, baixa precisão.
   - `'base'`: Rápido, precisão razoável.
   - `'small'`: Equilibrado (Padrão atual).
   - `'medium'`: Mais lento, melhor precisão.
   - `'large-v2'`: Muito pesado, melhor precisão possível.

**Exemplo para usar o modelo medium:**

```python
def __init__(self, model_size: str = "medium", ...):
```

Após alterar o código, **reconstrua a imagem Docker** para aplicar as mudanças.
