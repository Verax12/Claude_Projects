#!/usr/bin/env python3
"""
Gera src/data/terrain-base.bin — relevo de base (y relativo ao Fórum republicano) usado pelo jogo.

MÉTODO (documentado também em docs/FONTES.md e src/data/topography.js):
 1. Baixa os tiles do modelo digital de elevação Mapzen/Tilezen "Terrarium" (zoom 15),
    derivado de SRTM (~30 m) / EU-DEM — dados de domínio público / Copernicus
    ("SRTM data courtesy of the U.S. Geological Survey"; "Produced using Copernicus data and
    information funded by the European Union – EU-DEM layers").
 2. Reamostra para uma grade local de 8 m (origem 41.8925 N, 12.4850 E; x = leste, z = sul) e
    suaviza com gaussiana (sigma 24 m) para atenuar prédios modernos e ruído.
 3. Converte o relevo MODERNO para uma estimativa do relevo ANTIGO subtraindo uma correção c(x,z):
      - c "a priori" depende da altura: 9 m nos vales (S <= 25 m), 3 m nos cumes (S >= 50 m),
        linear entre eles  [HIPÓTESE: o aterro pós-antigo é maior nos vales — docs/pesquisa/10];
      - ajustada (resíduos com gaussiana de 60 m) para reproduzir exatamente as cotas antigas
        documentadas em docs/pesquisa/01 e 10:
          Fórum (0,0) = 13 m s.n.m.; Comício (0,-31) = 12,6 m;
          Capitolium (-221, 11) = 44,5 m; Arx (-145,-176) = 45,5 m; sela (-185,-40) = 36,5 m
        (cumes/sela = 38/39/30 m acima do Tibre, segundo Platner, com o Tibre a ~6,5 m s.n.m.).
 4. y = altura antiga − 13 m (nível do Fórum = 0). Salva Int16 em centímetros, 325 × 325.

Uso: python3 scripts/build-terrain.py   (precisa de numpy e pillow; acesso a s3.amazonaws.com)
"""
import math
import os
import sys
import urllib.request
import io

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'terrain-base.bin')
LAT0, LON0 = 41.8925, 12.485
R = 6378137.0
Z = 15
NT = 2 ** Z
X0, X1, Y0, Y1 = 17516, 17524, 12172, 12181
STEP = 8
HALF = 1296
N = HALF * 2 // STEP + 1
FORUM_ASL = 13.0

CONTROL = [  # (x, z, cota antiga m s.n.m.)
    (0, 0, 13.0),
    (0, -31, 12.6),
    (-221, 11, 44.5),
    (-145, -176, 45.5),
    (-185, -40, 36.5),
]


def tile(x, y, cache_dir):
    path = os.path.join(cache_dir, f't_{x}_{y}.png')
    if not os.path.exists(path):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png'
        with urllib.request.urlopen(url, timeout=30) as r:
            open(path, 'wb').write(r.read())
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)
    return im[:, :, 0] * 256 + im[:, :, 1] + im[:, :, 2] / 256 - 32768


def main():
    cache = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '.dem-cache')
    os.makedirs(cache, exist_ok=True)
    W = (X1 - X0 + 1) * 256
    H = (Y1 - Y0 + 1) * 256
    mos = np.zeros((H, W))
    for x in range(X0, X1 + 1):
        for y in range(Y0, Y1 + 1):
            mos[(y - Y0) * 256:(y - Y0 + 1) * 256, (x - X0) * 256:(x - X0 + 1) * 256] = tile(x, y, cache)

    def sample(xm, zm):
        lon = LON0 + xm / (R * math.cos(math.radians(LAT0))) * 180 / math.pi
        lat = LAT0 - zm / R * 180 / math.pi
        px = (lon + 180) / 360 * NT * 256 - X0 * 256 - 0.5
        latr = math.radians(lat)
        py = (1 - math.log(math.tan(latr) + 1 / math.cos(latr)) / math.pi) / 2 * NT * 256 - Y0 * 256 - 0.5
        i, j = int(math.floor(px)), int(math.floor(py))
        u, v = px - i, py - j
        return (mos[j, i] * (1 - u) * (1 - v) + mos[j, i + 1] * u * (1 - v)
                + mos[j + 1, i] * (1 - u) * v + mos[j + 1, i + 1] * u * v)

    raw = np.array([[sample(-HALF + i * STEP, -HALF + j * STEP) for i in range(N)] for j in range(N)])

    def smooth(a, sigma_m):
        s = sigma_m / STEP
        r = int(3 * s) + 1
        k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * s * s))
        k /= k.sum()
        b = np.pad(a, ((0, 0), (r, r)), mode='edge')
        a = np.array([np.convolve(row, k, mode='valid') for row in b])
        b = np.pad(a, ((r, r), (0, 0)), mode='edge')
        return np.array([np.convolve(col, k, mode='valid') for col in b.T]).T

    S = smooth(raw, 24)

    def at(a, x, z):
        fi, fj = (x + HALF) / STEP, (z + HALF) / STEP
        i, j = int(fi), int(fj)
        u, v = fi - i, fj - j
        return a[j, i] * (1 - u) * (1 - v) + a[j, i + 1] * u * (1 - v) + a[j + 1, i] * (1 - u) * v + a[j + 1, i + 1] * u * v

    prior = lambda s: np.clip(9 - 6 * (s - 25) / 25, 3, 9)
    # resíduos nos pontos de controle
    res = []
    for (x, z, asl) in CONTROL:
        s = at(S, x, z)
        res.append((x, z, (s - asl) - float(prior(s))))
    # interpolação RBF gaussiana (sigma 60 m) que passa exatamente pelos pontos de controle
    # e tende a zero longe deles (vale então só a correção a priori)
    xs = -HALF + np.arange(N) * STEP
    XX, ZZ = np.meshgrid(xs, xs)
    sig = 60.0
    P = np.array([[math.exp(-((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) / (2 * sig ** 2)) for b in res] for a in res])
    w = np.linalg.solve(P, np.array([r[2] for r in res]))
    resid = np.zeros_like(S)
    for (x, z, _), wi in zip(res, w):
        resid += wi * np.exp(-((XX - x) ** 2 + (ZZ - z) ** 2) / (2 * sig ** 2))
    ancient = S - (prior(S) + resid)
    y = ancient - FORUM_ASL
    for (x, z, asl) in CONTROL:
        print(f'controle ({x},{z}): alvo y={asl - FORUM_ASL:.2f}  obtido y={at(y, x, z):.2f}')
    arr = np.clip(np.round(y * 100), -32768, 32767).astype('<i2')
    open(OUT, 'wb').write(arr.tobytes())
    print('gravado', OUT, arr.shape, f'min {y.min():.1f} max {y.max():.1f}')


if __name__ == '__main__':
    main()
