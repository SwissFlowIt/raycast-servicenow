import { useLocalStorage } from "./useLocalStorage";

export type Instance = {
  id: string;
  name: string;
  alias: string;
  color: string;
  username: string;
  password: string;
};

const compareInstances = (a: Instance, b: Instance): number => {
  const nameA = a.alias ? a.alias : a.name;
  const nameB = b.alias ? b.alias : b.name;
  return nameA.localeCompare(nameB);
};

export default function useInstances() {
  const { value, setValue, mutate, isLoading } = useLocalStorage<Instance[]>(
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

  return { instances: value.sort((a, b) => compareInstances(a,b)), addInstance, editInstance, deleteInstance, mutate, isLoading };
}
