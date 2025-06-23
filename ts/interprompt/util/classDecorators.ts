export function singleton<T extends new (...args: any[]) => any>(Ctor: T) {
  let instance: InstanceType<T> | null = null;
  return (...args: ConstructorParameters<T>): InstanceType<T> => {
    if (instance === null) {
      instance = new Ctor(...args);
    }
    return instance as InstanceType<T>;
  };
}
