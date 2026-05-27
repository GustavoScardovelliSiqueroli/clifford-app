import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ClienteRepository, type Cliente } from 'src/database/repositories/cliente-repository';

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([]);
  const loading = ref(false);

  async function carregar() {
    loading.value = true;
    clientes.value = await ClienteRepository.findAll();
    loading.value = false;
  }

  async function adicionar(dados: Omit<Cliente, 'id' | 'created_at'>) {
    await ClienteRepository.create(dados);
    await carregar();
  }

  async function atualizar(id: number, dados: Partial<Cliente>) {
    await ClienteRepository.update(id, dados);
    await carregar();
  }

  async function remover(id: number) {
    await ClienteRepository.remove(id);
    await carregar();
  }

  return { clientes, loading, carregar, adicionar, atualizar, remover };
});
