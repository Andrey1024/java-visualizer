import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';
import * as d3 from 'd3-hierarchy';
import { HierarchyRectangularNode, TreemapLayout } from 'd3-hierarchy';
import { Element } from '../model/element.model';
import { last } from 'lodash-es';
import { Overlay } from '@angular/cdk/overlay';

export interface HierarchyCityNode extends HierarchyRectangularNode<Element> {
    z0: number;
    z1: number;

    figure: THREE.Object3D;
}

@Injectable()
export class CityService implements SceneService {

    private layout: TreemapLayout<Element>;

    private citySize = 1500;
    private font: THREE.Font;

    constructor(private overlay: Overlay) {
        // this.tooltip.style.position = 'absolute';
        this.layout = d3.treemap<Element>().size([this.citySize, this.citySize])
            .round(false)
            .paddingOuter(30)
            .paddingInner(20)
            .tile(d3.treemapBinary);
        new THREE.FontLoader().load('assets/helvetiker_regular.typeface.json', (font => {
            this.font = font;
        }));
    }

    private static closeValue(value: number, ...steps: number[]): number {
        let i = 0;
        while (value > steps[i]) {
            i++;
        }

        return steps[i];
    }

    private static getElementWeight(element: Element): number {
        switch (element.type) {
            case 'CLASS':
            case 'INTERFACE':
                return  CityService.closeValue(element.methodsCount, 10, 20, 30, 40, 50);
            case 'CONTAINER':
                return element.children.length * 10 + 10;
            default:
                return 10;
        }
    }

    show(struct: Element): THREE.Object3D[] {
        const tree = d3.hierarchy(struct)
            .sort(((a, b) => a.data.name.localeCompare(b.data.name)))
            .sum(CityService.getElementWeight);
        const city = this.createCityHierarchy(this.layout(tree));
        return city.descendants().map(node => node.figure);
    }

    private createCityHierarchy(hierarchy: HierarchyRectangularNode<Element>): HierarchyCityNode {
        (hierarchy as HierarchyCityNode).eachBefore(node => {
            const characteristics = this.getCharacteristics(node);
            node.z0 = node.parent === null ? 0 : node.parent.z1;
            node.z1 = node.z0 + characteristics.height;
            this.createNodeMesh(node, characteristics.color);
            this.createTitleMesh(node);
        });
        return hierarchy as HierarchyCityNode;
    }

    private getCharacteristics(node: HierarchyCityNode): { height: number, color: THREE.Color } {
        let height = 0;

        switch (node.data.type) {
            case 'CONTAINER':
                height = 15;
                break;
            case 'CLASS':
            case 'INTERFACE':
                height = Math.max(node.data.methodsCount * 5, 15);
                break;
        }

        const sampleNumber = last(node.ancestors()).data.lifeSpan;
        const color = new THREE.Color('yellow').lerp(new THREE.Color('blue'), node.data.lifeSpan / (sampleNumber + 1));

        return { height, color };
    }

    private createNodeMesh(node: HierarchyCityNode, color: THREE.Color) {
        const y = node.y1 - node.y0;
        const x = node.x1 - node.x0;
        const z = node.z1 - node.z0;
        const material = new THREE.MeshPhongMaterial({
            color
        });
        let geometry;
        if (node.data.type === 'INTERFACE') {
            const rad = Math.min(x, y) / 2;
            geometry = new THREE.CylinderGeometry(rad, rad, z, 32, 32)
                .translate(node.x0 + x / 2 - this.citySize, node.z0 + z / 2, node.y0 + y / 2 - this.citySize);
        } else {
            geometry = new THREE.BoxGeometry(node.x1 - node.x0, z, node.y1 - node.y0)
                .translate(node.x0 + x / 2 - this.citySize, node.z0 + z / 2, node.y0 + y / 2 - this.citySize);
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        node.figure = mesh;
        node.figure['rawObject'] = node.data;
    }

    private createTitleMesh(node: HierarchyCityNode): THREE.Mesh {
        if (!node.data.name
            || node.data.type !== 'CONTAINER'
            || (node.x1 - node.x0) < 5 * node.data.name.length) {
            return;
        }
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color('white')
        });
        const geometry = new THREE.TextGeometry(node.data.name, {
            font: this.font,
            size: 5,
            height: 0.01
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x0 - this.citySize, node.z1 - 10, node.y1 - this.citySize);
        node.figure.add(mesh);
    }

}
