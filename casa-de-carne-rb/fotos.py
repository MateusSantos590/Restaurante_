"""Prepara as fotos da loja para o site, sempre na proporção 4:3.

Uso:
  1. Coloque as fotos originais (JPG ou PNG, do celular mesmo) em
     casa-de-carne-rb/fotos-originais/ com estes nomes:
        fachada.jpg  balcao.jpg  cortes.jpg  estacionamento.jpg
  2. Rode:  python3 casa-de-carne-rb/fotos.py
  3. Em public/index.html, apague o atributo `hidden` da seção id="a-loja"
     e confira os textos alternativos (alt) de cada foto.

O que o script faz com cada foto:
  - gira conforme o celular gravou (EXIF), para a foto não ficar deitada;
  - recorta no centro para 4:3 (largura:altura), sem esticar;
  - gera 640 e 1280 px de largura, em WebP (leve) e JPEG (compatível);
  - apaga os metadados (EXIF), que podem conter a localização GPS e o
    modelo do celular de quem tirou a foto.
"""
from pathlib import Path
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Instale o Pillow: python3 -m pip install Pillow")

BASE = Path(__file__).resolve().parent
ORIGEM = BASE / "fotos-originais"
DESTINO = BASE / "public" / "img" / "loja"
SLOTS = ["fachada", "balcao", "cortes", "estacionamento"]
LARGURAS = [640, 1280]
PROPORCAO = 4 / 3


def recorta_4x3(img):
    w, h = img.size
    if w / h > PROPORCAO:  # larga demais: corta as laterais
        novo_w = round(h * PROPORCAO)
        x = (w - novo_w) // 2
        return img.crop((x, 0, x + novo_w, h))
    novo_h = round(w / PROPORCAO)  # alta demais: corta em cima e embaixo
    y = (h - novo_h) // 2
    return img.crop((0, y, w, y + novo_h))


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    feitos = 0
    for slot in SLOTS:
        arquivos = [p for p in ORIGEM.glob(slot + ".*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        if not arquivos:
            print(f"falta: fotos-originais/{slot}.jpg")
            continue
        img = ImageOps.exif_transpose(Image.open(arquivos[0])).convert("RGB")
        img = recorta_4x3(img)
        if img.width < LARGURAS[-1]:
            print(f"aviso: {slot} tem só {img.width}px de largura; o ideal é 1280px ou mais")
        for largura in LARGURAS:
            altura = round(largura / PROPORCAO)
            r = img.resize((largura, altura), Image.LANCZOS)
            # Salvar sem o parâmetro exif descarta os metadados originais
            r.save(DESTINO / f"{slot}-{largura}.webp", "WEBP", quality=80, method=6)
            r.save(DESTINO / f"{slot}-{largura}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        feitos += 1
        print(f"ok: {slot} ({img.width}x{img.height} -> 640 e 1280 px, 4:3)")
    print(f"\n{feitos} de {len(SLOTS)} fotos prontas em {DESTINO.relative_to(BASE.parent)}")
    if feitos == len(SLOTS):
        print('Agora apague o atributo hidden da seção id="a-loja" em public/index.html.')


if __name__ == "__main__":
    main()
