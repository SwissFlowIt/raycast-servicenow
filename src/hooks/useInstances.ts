import { useLocalStorage } from "./useLocalStorage";

export type Instance = {
  id: string;
  name: string;
  alias: string;
  color: string;
  username: string;
  password: string;
};

export default function useInstances() {
  const { value, setValue, mutate } = useLocalStorage<Instance[]>(
    "saved-instances",
    []
  );

  async function addInstance (instance: Instance) {
    setValue([...value, instance]);
  }

  async function editInstance(instance: Instance) {
    setValue(value.map((i) => (i.id === instance.id ? instance : i)));
  }

  async function deleteInstance(instanceId: string) {
    setValue(value.filter((i) => i.id !== instanceId));
  }

  return { instances: value.sort((a, b) => (a.alias?a.alias:a.name).localeCompare(b.alias?b.alias:b.name)), addInstance, editInstance, deleteInstance, mutate };
}
