import { defineStore } from 'pinia';
import { ref } from 'vue';
import { AjusteRepository, type Ajuste } from 'src/database/repositories/ajustes-repository';

export const useConfigStore = defineStore('config', () => {
  const ajuste = ref<Ajuste | null>(null);
  const loading = ref(false);

  async function carregar() {
    loading.value = true;
    ajuste.value = await AjusteRepository.find();
    loading.value = false;
  }

  async function salvar(dados: Omit<Ajuste, 'id'>) {
    loading.value = true;
    await AjusteRepository.save(dados);
    await carregar();
    loading.value = false;
  }

  return { ajuste, loading, carregar, salvar };
});