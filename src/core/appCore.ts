import { QueryResult } from 'pg';
import { DatabaseCore } from './dataBaseCore';
import { ApiTable } from '../types/coreApiTypes';
import { AppRequest, AppResponse } from './controllerBase';

class App {
    public static Request: AppRequest = null;
    public static Response: AppResponse = null;

    public static setContext(req: AppRequest, res: AppResponse): void {
        this.Request = req;
        this.Response = res;
    }

    public static write(content: string): void {
        if (this.Response) {
            this.Response.write(content);
        } else {
            console.error('Erreur: Aucun contexte de réponse défini.');
        }
    }

    public static async query(sql: string, ...args: any[]): Promise<QueryResult> {
        const db = new DatabaseCore(ApiTable.LOGS, []);
        return await db.query(sql, ...args);
    }

    public static async queryGet<T = any>(sql: string, ...args: any[]): Promise<QueryResult<T>> {
        return await this.query(sql, ...args);
    }

    public static async queryDo(sql: string, ...args: any[]): Promise<void> {
        await this.query(sql, ...args);
    }

    public static async isQueryExists(sql: string, ...args: any[]): Promise<boolean> {
        const req = await this.query(`SELECT EXISTS (${sql})`, ...args);
        return req.rows[0].exists;
    }
}

export default App;
