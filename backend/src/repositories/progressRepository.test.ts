import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const moduleDirectory=dirname(fileURLToPath(import.meta.url));

test('dashboard analytics queries support an empty PostgreSQL account',async()=>{
  const database=new PGlite();
  try{
    await database.exec(await readFile(resolve(moduleDirectory,'../../database/schema.sql'),'utf8'));
    const userId='00000000-0000-4000-8000-000000000001';
    await database.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)',[userId,'Test Student','dashboard@example.com','hash']);
    const repository=await readFile(resolve(moduleDirectory,'progressRepository.ts'),'utf8');
    const statements=[...repository.matchAll(/`(SELECT[\s\S]*?)`/g)].map(match=>match[1]!);
    assert.equal(statements.length,8);
    for(const statement of statements){
      const parameterCount=statement.match(/\?/g)?.length??0;
      const values=statement.includes("? * INTERVAL '1 minute'")?[0,...Array(parameterCount-1).fill(userId)]:Array(parameterCount).fill(userId);
      let parameterIndex=0;
      await database.query(statement.replace(/\?/g,()=>`$${++parameterIndex}`),values);
    }
  }finally{
    await database.close();
  }
});
