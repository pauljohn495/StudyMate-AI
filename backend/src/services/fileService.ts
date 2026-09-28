import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export interface FileStorage {save(key:string,data:Buffer,contentType?:string):Promise<void>;read(key:string):Promise<Buffer>;delete(key:string):Promise<void>}
const storageRoot=path.resolve(process.cwd(),env.UPLOAD_DIR);
const safePath=(key:string)=>{const normalized=key.replaceAll('\\','/').replace(/^\/+/, '');const resolved=path.resolve(storageRoot,normalized);if(resolved!==storageRoot&&!resolved.startsWith(`${storageRoot}${path.sep}`))throw new Error('Unsafe storage key.');return resolved;};

class LocalFileStorage implements FileStorage {
  async save(key:string,data:Buffer){const target=safePath(key);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data,{flag:'wx'});}
  read(key:string){return readFile(safePath(key));}
  async delete(key:string){try{await unlink(safePath(key));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
}

class SupabaseFileStorage implements FileStorage {
  private readonly client=createClient(env.SUPABASE_URL!,env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  private get bucket(){return this.client.storage.from(env.SUPABASE_STORAGE_BUCKET);}
  async save(key:string,data:Buffer,contentType='application/octet-stream'){const {error}=await this.bucket.upload(key,data,{contentType,upsert:false});if(error)throw new Error(`Supabase upload failed: ${error.message}`);}
  async read(key:string){const {data,error}=await this.bucket.download(key);if(error)throw new Error(`Supabase download failed: ${error.message}`);return Buffer.from(await data.arrayBuffer());}
  async delete(key:string){const {error}=await this.bucket.remove([key]);if(error)throw new Error(`Supabase delete failed: ${error.message}`);}
}

export const fileStorage:FileStorage=env.SUPABASE_URL&&env.SUPABASE_SECRET_KEY?new SupabaseFileStorage():new LocalFileStorage();
