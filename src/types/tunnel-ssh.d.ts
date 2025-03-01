declare module "tunnel-ssh" {
  const tunnel: (
    config: any,
    callback: (error?: Error) => void
  ) => { close: () => void };

  export = tunnel;
}
