import { Action, Selector, State, StateContext } from '@ngxs/store';
import { HttpClient } from "@angular/common/http";
import { tap } from "rxjs/operators";
import { patch } from "@ngxs/store/operators";
import { Hierarchy } from "../model/hierarchy.model";
import { ProjectModel } from "../model/server-model/project.model";
import { NodeVersioned } from "../model/versioned/node-versioned.model";
import { Injectable } from "@angular/core";
import { ItemNode } from "../model/tree-item.model";

export const rootPath = 'Project Root';

export class Load {
    static readonly type = '[Code Structure] load';

    constructor(public rep: string = '') {
    }
}

export class LoadReverse {
    static readonly type = '[Code Structure] load reversed';
}

export class SetVersion {
    static readonly type = '[Code Structure] select source';

    constructor(public version: number) {
    }
}

export class SelectNodes {
    static readonly type = '[Code Structure] select nodes';

    constructor(public selectedNodes: string[]) {
    }
}

export class SetRoot {
    static readonly type = '[Code Structure] set root';

    constructor(public rootPath: string) {
    }
}

export class Focus {
    static readonly type = '[Code Structure] focus';

    constructor(public name: string) {
    }

}

export interface CodeStructureStateModel {
    name: string;
    data: { [fullPath: string]: NodeVersioned<any> };
    versions: string[];
    selectedNodes: string[];
    version: number;
    rootPath: string;
    loaded: boolean;
    highLight: string;
}

function getHierarchy(data, path: string, version: string): Hierarchy {
    const el = data[path][version];
    if (el === undefined) {
        return null;
    }
    return el.type === 'CONTAINER'
        ? el.children.reduce((acc, cur) => {
            return { ...acc, [cur]: getHierarchy(data, cur, version) }
        }, {})
        : el;
}

function buildItemTree(data, path: string, version: string): ItemNode[] {
    const el = data[path][version];

    return el.type === 'CONTAINER'
        ? el.children
            .map(child => new ItemNode(data[child][version].fullPath, data[child][version].name, buildItemTree(data, child, version)))
        : null;

}

@State<CodeStructureStateModel>({
    name: 'codeStructure',
    defaults: {
        name: null,
        data: null,
        rootPath: rootPath,
        versions: [],
        version: 0,
        selectedNodes: [],
        loaded: false,
        highLight: null
    }
})
@Injectable()
export class CodeStructureState {
    @Selector([CodeStructureState])
    static isLoaded(state: CodeStructureStateModel): boolean {
        return state.loaded;
    }

    @Selector([CodeStructureState])
    static getData(state: CodeStructureStateModel) {
        return state.data;
    }


    @Selector([CodeStructureState])
    static getName(state: CodeStructureStateModel) {
        return state.name;
    }

    @Selector([CodeStructureState])
    static getVersion(state: CodeStructureStateModel) {
        return state.version;
    }

    @Selector([CodeStructureState])
    static getVersions(state: CodeStructureStateModel) {
        return state.versions;
    }

    @Selector([CodeStructureState])
    static getRootPath(state: CodeStructureStateModel) {
        return state.rootPath;
    }

    @Selector([CodeStructureState])
    static getSelectedNodes(state: CodeStructureStateModel) {
        return new Set(state.selectedNodes);
    }

    @Selector([CodeStructureState.isLoaded, CodeStructureState.getRootPath, CodeStructureState.getVersion, CodeStructureState.getVersions, CodeStructureState.getData])
    static getHierarchy(loaded, rootPath, version, versions, data) {
        if (!loaded) {
            return null;
        }
        return getHierarchy(data, rootPath, versions[version]);
    }

    @Selector([CodeStructureState.isLoaded, CodeStructureState.getRootPath, CodeStructureState.getVersion, CodeStructureState.getVersions, CodeStructureState.getData])
    static getTreeItems(loaded, rootPath, version, versions, data) {
        if (!loaded) {
            return [];
        }
        return buildItemTree(data, rootPath, versions[version]);
    }

    @Selector([CodeStructureState])
    static getHighLight(state: CodeStructureStateModel) {
        return state.highLight;
    }

    constructor(private http: HttpClient) {
    }

    @Action(LoadReverse)
    loadReverse(ctx: StateContext<CodeStructureStateModel>) {
        ctx.patchState({ loaded: false });
        return this.http.get<ProjectModel[]>('/api/model').pipe(
            tap(results => {
                const versions = results.map(v => v.version);
                const name = results[0].name;
                const data = {};
                results.forEach(project => {
                    project.data.forEach(el => {
                        const fullPath = el.fullPath === null ? rootPath : el.fullPath;
                        data[fullPath] = data[fullPath] ? data[fullPath] : {};
                        data[fullPath][project.version] = { ...el, lifeSpan: Object.keys(data[fullPath]).length };
                    });
                });
                ctx.setState(patch<CodeStructureStateModel>({
                    loaded: true, versions, version: 0, data, selectedNodes: Object.keys(data), name
                }));
            })
        );
    }


    @Action(SelectNodes)
    selectNodes(ctx: StateContext<CodeStructureStateModel>, { selectedNodes }: SelectNodes) {
        ctx.patchState({ selectedNodes });
    }

    @Action(SetVersion)
    selectSource(ctx: StateContext<CodeStructureStateModel>, { version }: SetVersion) {
        ctx.patchState({ version });
    }

    @Action(SetRoot)
    setRoot(ctx: StateContext<CodeStructureStateModel>, { rootPath }: SetRoot) {
        ctx.patchState({ rootPath });
    }

    @Action(Focus)
    focusObject(ctx: StateContext<CodeStructureStateModel>, { name }: Focus) {
        if (ctx.getState().highLight !== name) {
            ctx.patchState({ highLight: name });
        }
    }
}
