import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const moduleDirectory=dirname(fileURLToPath(import.meta.url));

test('creates the complete PostgreSQL schema and enforces core relationships',async()=>{
  const database=new PGlite();
  try{
    const schema=await readFile(resolve(moduleDirectory,'../../database/schema.sql'),'utf8');
    await database.exec(schema);
    const tables=await database.query<{table_name:string}>("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    assert.equal(tables.rows.length,30);
    const secured=await database.query<{total:number}>("SELECT COUNT(*)::int total FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity");
    assert.equal(secured.rows[0]?.total,30);
    await database.query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",['00000000-0000-4000-8000-000000000001','Test Student','test@example.com','hash']);
    await database.query("INSERT INTO subjects(id,user_id,name) VALUES($1,$2,$3)",['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Networks']);
    await database.query("INSERT INTO lessons(id,subject_id,title) VALUES($1,$2,$3)",['00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','Security']);
    const result=await database.query<{lesson_count:number}>("SELECT COUNT(l.id)::int lesson_count FROM subjects s LEFT JOIN lessons l ON l.subject_id=s.id WHERE s.id=$1 GROUP BY s.id",['00000000-0000-4000-8000-000000000002']);
    assert.equal(result.rows[0]?.lesson_count,1);
  }finally{await database.close();}
});
