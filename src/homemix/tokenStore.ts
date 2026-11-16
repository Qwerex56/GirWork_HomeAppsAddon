/** Where the GIR session token is kept between visits. */
export interface TokenStore {
  read(): Promise<string>
  write(token: string): Promise<void>
  clear(): Promise<void>
}
