/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * @khatastroffik/treeifier-utils
 *
 * License: MIT
 * Copyright (c) 2020, Loïs Bégué
 *
**/

// TODO: TBD :: add a "compare treenodes" function. 

import { TreeifierNode } from '@khatastroffik/treeifier/dist/treeifier-node';
import { TreeifierNodeTypes } from '@khatastroffik/treeifier/dist/treeifier-node-parser';
import chalk from "chalk";
import { Treeifier, NodeProcessorFunction } from '@khatastroffik/treeifier';

export class TreeifierUtils {

  private static readonly defaultStructureColor = chalk.blue;
  private static readonly defaultKeyColor = chalk.white;
  private static readonly defaultValueColor = chalk.greenBright;
  private static readonly defaultCircularColor = chalk.redBright;

  static StructureColor = TreeifierUtils.defaultStructureColor;
  static KeyColor = TreeifierUtils.defaultKeyColor;
  static ValueColor = TreeifierUtils.defaultValueColor;
  static CircularColor = TreeifierUtils.defaultCircularColor;

  static resetAllColors(): void {
    TreeifierUtils.StructureColor = TreeifierUtils.defaultStructureColor;
    TreeifierUtils.KeyColor = TreeifierUtils.defaultKeyColor;
    TreeifierUtils.ValueColor = TreeifierUtils.defaultValueColor;
    TreeifierUtils.CircularColor = TreeifierUtils.defaultCircularColor;
  }

  static defaultColoredTypesProcessor( node: TreeifierNode ): string {
    let result = TreeifierUtils.StructureColor( node.prefix + node.joint ) +
      TreeifierUtils.KeyColor( node.key ) +
      TreeifierUtils.StructureColor( ' : ' ) +
      TreeifierUtils.ValueColor( TreeifierUtils.nodeTypeToString( node.nodeType ) );
    if ( node.isBranch ) {
      node.children.forEach( ( child: TreeifierNode ): void => {
        child.processResult && ( result = result + '\n' + child.processResult )
      } );
    }
    return result;
  }

  static defaultColoredValuesProcessor( node: TreeifierNode ): string {
    const circular = node.isCircular ? ' -> ' + node.circularRefNode?.key ?? '?' : '';
    const nodeValue = node.isLeaf ? node.toString() : ''
    let result = TreeifierUtils.StructureColor( node.prefix + node.joint ) +
      TreeifierUtils.KeyColor( node.key ) +
      TreeifierUtils.StructureColor( nodeValue? ' : ': '' ) +
      TreeifierUtils.ValueColor( nodeValue ) +
      TreeifierUtils.CircularColor( circular );
    if ( node.isBranch ) {
      node.children.forEach( ( child: TreeifierNode ): void => {
        child.processResult && ( result = result + '\n' + child.processResult )
      } );
    }
    return result;
  }

  static defaultHTMLProcessor( node: TreeifierNode ): string {
    let result = '';
    const circularKey = node.circularRefNode?.key ?? '?';
    const circularPath = node.circularRefNode?.path ?? '';
    const circularLink = node.isCircular ? `<a href="#list@${circularPath}">${circularKey}</a>` : circularKey;
    const circularReference = node.isCircular ? `<span class="circularlink">${circularLink}</span>` : '';
    const nodeTypeClass = `nt_${TreeifierUtils.nodeTypeToString( node.nodeType )}`;
    const nodeKey = ( node.parent?.nodeType === TreeifierNodeTypes.arrayofobjects ) ? '' : `<span class="key">${node.key}</span>: `;
    const nodeValue = node.isLeaf ? `<span class="value${node.isCircular ? ' circular' : ''}">${node.toString()}</span> ${circularReference}` : '';
    node.parent && ( result = `<li id="${node.path}" class="leaf ${nodeTypeClass}">\n${nodeKey}${nodeValue}` );
    if ( node.isBranch ) {
      const listType = ( node.nodeType === TreeifierNodeTypes.arrayofobjects ) ? 'ol start="0"' : 'ul';
      let list = `<${listType} id="list@${node.path}" class="branch ${nodeTypeClass}">`;
      node.children.forEach( ( child: TreeifierNode ): void => {
        child.processResult && ( list += '\n' + child.processResult )
      } );
      list += `\n</${listType.substr( 0, 2 )}>`;
      result += '\n' + list;
    }
    node.parent && ( result += '\n</li>' );
    return result;
  }

  static nodeTypeToString( nodetype: TreeifierNodeTypes ): string {
    return TreeifierNodeTypes[nodetype];
  }

  private static debugProcessor( node: TreeifierNode ): string {
    const circular = ( node.isCircular && node.circularRefNode ) ? node.circularRefNode.value.path ?? node.circularRefNode.key : '';
    let nodeValueString = node.toString();
    if ( node.key === 'processResult' ) nodeValueString = nodeValueString.replace( /\r?\n|\r/g, '\\n' );
    if ( node.key === 'nodeType' ) nodeValueString = TreeifierUtils.nodeTypeToString( node.value );
    if ( node.key === 'ancestors' ) {
      if ( node.circularRefNode === null ) return '';
      nodeValueString = '[' + node.ancestors.map( ( element: TreeifierNode ) => { return element.value.path } ).join( ', ' ) + ']';
    }
    if ( node.key === 'circularRefIndex' && node.value < 0 ) return '';
    if ( node.key === 'circularRefNode' && node.value === null ) return '';
    if ( node.key === 'isCircular' && node.value != true ) return '';
    if ( node.key === 'children' && node.value.length < 1 ) return '';
    let result = TreeifierUtils.StructureColor( node.prefix + node.joint ) + TreeifierUtils.KeyColor( node.key ) + TreeifierUtils.ValueColor( ( ( node.isLeaf || node.key === 'ancestors' ) ? ' ' + nodeValueString : '' ) ) + TreeifierUtils.CircularColor( ' ' + circular );
    if ( node.isBranch && !( node.key === 'ancestors' ) ) {
      node.children.forEach( ( child: TreeifierNode ): void => {
        child.processResult && ( result = result + '\n' + child.processResult )
      } );
    }
    return result;
  }

  static debugResultNode( rootnode: TreeifierNode, treeifier?: Treeifier ): string {
    const debugTreeifier = treeifier ?? new Treeifier();
    return debugTreeifier.process( rootnode, 'debug@' + rootnode.key, TreeifierUtils.debugProcessor );
  }

  static debug( item: any, label?: string, nodeProcessorCallback?: NodeProcessorFunction ): string {
    const treeifier = new Treeifier();
    return TreeifierUtils.debugResultNode( treeifier.parse( item, label, nodeProcessorCallback ), treeifier );
  }
}
