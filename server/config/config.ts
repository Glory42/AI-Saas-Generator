interface Config {
    port: number,
    JWT_TOKEN: string,

}

const config: Config = {
    port: Number(process.env.PORT),
    JWT_TOKEN: String(process.env.JWT_TOKEN),
}

export default config;