/**
 * Ponto de entrada: cria o Engine e inicia o carregamento da cidade.
 */
import { Engine } from './core/Engine.js';

const engine = new Engine(document.getElementById('app'), document.getElementById('ui'));
engine.start().catch((err) => {
  console.error(err);
  const el = document.querySelector('#loading .status');
  if (el) el.textContent = `Erro ao iniciar: ${err.message}`;
});
