import Table from './table';
import { ApiTable, QuerySearch } from '~/types/coreApiTypes';
import { UserAccessLevel } from '~/types/typeCore';
import { Task, TaskPayload } from '~/models/task';
import { GrammarModel, TableDisplay, TableType } from '~/types/tableType';

class ScheduleModule extends Table<Task, TaskPayload> {
    constructor() {
        super(null, Task);
    }
    protected override Table(): ApiTable {
        return ApiTable.SCHEDULES;
    }
    protected override Grammar(): GrammarModel {
        return {
            singular: '$schedule.singular',
            singularArticle: '$common.specifiers.singularFem',
            plural: '$schedule.plural',
            pluralArticle: '$common.specifiers.plural',
            isFem: true,
        };
    }
    protected override TableIcon(): string {
        return 'WatchLater';
    }
    protected override Level(): UserAccessLevel {
        return UserAccessLevel.USER;
    }
    protected override AllowDelete(): boolean {
        return false;
    }
    protected override AllowUpdate(): boolean {
        return false;
    }
    protected override AllowNew(): boolean {
        return false;
    }
    protected override AllowExport(): boolean {
        return false;
    }
    protected override SearchContent(): QuerySearch<Task>[] {
        return [
            { field: 'id', dbField: 'id', typeClause: 'EQUALS', typeWhere: 'EQUALS' },
            { field: 'name', dbField: 'name', typeClause: 'EQUALS', typeWhere: 'LIKE' },
        ];
    }
    protected override DefaultSort(): keyof Task {
        return 'lastExecution';
    }
    protected override DefaultAsc(): boolean {
        return false;
    }

    protected override TableTemplate(): TableDisplay<Task> {
        return {
            defaultSort: { field: 'lastExecution', sort: 'desc' },
            actions: ['update', 'delete'],
            colStruct: [
                {
                    headerField: 'id',
                    headerLabel: 'ID',
                    sortable: true,
                    type: TableType.NUM,
                    width: 20,
                },
                {
                    headerField: 'name',
                    headerLabel: 'Nom',
                    sortable: true,
                    type: TableType.TEXT,
                },
                {
                    headerField: 'description',
                    headerLabel: 'Description',
                    sortable: true,
                    type: TableType.TEXT,
                },
                {
                    headerField: 'frequence',
                    headerLabel: 'Fréquence',
                    sortable: true,
                    type: TableType.TEXT,
                },
                {
                    headerField: 'isActive',
                    headerLabel: 'Active ?',
                    sortable: true,
                    type: TableType.BOOL,
                },
                {
                    headerField: 'lastExecution',
                    headerLabel: 'Dernière Exec.',
                    sortable: true,
                    type: TableType.DATETIME,
                },
                {
                    headerField: 'nextExecution',
                    headerLabel: 'Prochaine Exec.',
                    sortable: true,
                    type: TableType.DATETIME,
                },
            ],
        };
    }
}

export default ScheduleModule;
