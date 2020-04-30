import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from "@ngxs/store";
import { BehaviorSubject, Observable } from "rxjs";
import { Author, Commit } from "../../model/server-model/commit.model";
import { ActivatedRoute } from "@angular/router";
import { CommitsState, Load } from "../../state/commits.state";
import {
    AuthorView, Focus,
    LoadState,
    RepositoryState,
    SelectAuthors,
    SelectCommit,
    SelectNodes,
    SelectSourceRoot, UpdateSearch
} from "../../state/repository.state";
import { ItemNode } from "../../model/tree-item.model";
import { Hierarchy } from "../../model/hierarchy.model";
import { DisplayOptions, LayoutService } from "../../service/layout.service";
import { CanvasVisualizerComponent } from "../../components/canvas-visualizer/canvas-visualizer.component";

@Component({
    selector: 'uml-city',
    templateUrl: './city.component.html',
    styleUrls: ['./city.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityComponent implements OnInit {
    @ViewChild(CanvasVisualizerComponent, { static: true }) canvas: CanvasVisualizerComponent;

    @Select(CommitsState.getRepositoryName)
    name$: Observable<string>

    @Select(RepositoryState.getAuthorsWithCount)
    authors$: Observable<{ author: Author, count: number }[]>;

    @Select(CommitsState.getAllCommitsDesc)
    commits$: Observable<Commit[]>;

    @Select(CommitsState.isLoaded)
    isLoaded$: Observable<boolean>;

    @Select(RepositoryState.getLoadedCommits)
    loadedCommits$: Observable<Commit[]>;

    @Select(RepositoryState.getLoadingCommits)
    loadingCommits$: Observable<Commit[]>;

    @Select(RepositoryState.getTreeItems)
    treeItems$: Observable<ItemNode[]>;

    @Select(RepositoryState.getHierarchy)
    hierarchy$: Observable<Hierarchy>;

    @Select(RepositoryState.getSelectedNodes)
    selectedNodes$: Observable<string[]>;

    @Select(RepositoryState.getSelectedCommit)
    selectedCommit$: Observable<string>;

    @Select(RepositoryState.getSelectedAuthors)
    selectedAuthors$: Observable<string[]>;

    @Select(RepositoryState.getSourceRoots)
    sourceRoots$: Observable<string[]>;

    @Select(RepositoryState.getSourceRoot)
    sourceRoot$: Observable<string>

    @Select(RepositoryState.getLayoutOptions)
    options$: Observable<DisplayOptions>;

    @Select(CommitsState.getAuthorsHSL)
    authorColors$: Observable<{ [email: string]: number }>;

    @Select(RepositoryState.getSearch)
    search$: Observable<string>;

    layoutNames = this.layouts.map(layout => layout.name);
    selectedLayout$ = new BehaviorSubject<string>(this.layoutNames[0]);

    constructor(private store: Store,
                private route: ActivatedRoute,
                @Inject(LayoutService) private layouts: LayoutService[]) {
        this.selectedLayout$.next(layouts[0].name);
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => this.store.dispatch(new Load(params.get("name"))).subscribe(() => {
            const commits = this.store.selectSnapshot(CommitsState.getAllCommits);
            this.store.dispatch([new LoadState(commits[commits.length - 1].name)]);
        }));
    }

    selectCommit(commit: Commit) {
        this.store.dispatch(new SelectCommit(commit.name));
    }

    selectAuthors(authors: string[]) {
        this.store.dispatch(new SelectAuthors(authors));
    }

    loadCommitState(commit: Commit) {
        this.store.dispatch(new LoadState(commit.name))
    }

    selectSourceRoot(root: string) {
        this.store.dispatch(new SelectSourceRoot(root));
    }

    selectNodes(nodes: string[]) {
        this.store.dispatch(new SelectNodes(nodes));
    }

    selectAuthorsView(showAuthors: boolean) {
        this.store.dispatch(new AuthorView(showAuthors));
    }

    updateSearch(search: string) {
        this.store.dispatch(new UpdateSearch(search))
    }

    focusNode(node: string) {
        this.canvas.focusOnElement(node);
    }
}
