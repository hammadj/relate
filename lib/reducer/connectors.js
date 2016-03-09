import forEach from 'lodash.foreach';
import get from 'lodash.get';
import intersection from 'lodash.intersection';
import invariant from 'invariant';
import merge from 'lodash.merge';
import set from 'lodash.set';
import union from 'lodash.union';
import warning from 'warning';

import store from './store';

export class Connectors {
  constructor () {
    // Connectors info
    // composed of connectors and their info, e.g
    // {
    //   connector_1: {
    //     data: {
    //       pages: ['56d0583eb0dc646f07b05cf2', '568fc7d152e76bc604a74520']
    //     },
    //     listens: {
    //       pages: ['56d0583eb0dc646f07b05cf2', '568fc7d152e76bc604a74520', ...]
    //     },
    //     mutations: {
    //       addPage: [
    //         {
    //           type: 'APPEND', // INCREMENT || DECREMENT || APPEND || PREPEND
    //           field: 'pages'
    //         },
    //         {
    //           type: 'INCREMENT',
    //           field: ['pages', 'pagesCount']
    //         }
    //       ]
    //     }
    //   }
    // }
    this.connectors = {};
  }

  generateConnectorData (connectorId) {
    const connectorData = this.connectors[connectorId].data;
    const result = {};

    forEach(connectorData, (data, dataName) => {
      result[dataName] = store.getData(data);
    });

    return result;
  }

  // Process a query through the connectors that requested it
  processConnectors (queryConnectors, queryName, relativeNodes, nodes) {
    forEach(queryConnectors, (connectorQuery, connectorId) => {
      // check if query was triggered by this connector
      if (connectorQuery.fragments[queryName]) {
        if (this.connectors[connectorId]) {
          const conn = this.connectors[connectorId];
          Object.assign(conn.data, {
            [queryName]: relativeNodes
          });
          Object.assign(conn.listens, {
            [queryName]: nodes
          });
          conn.mutations = connectorQuery.mutations;
        } else {
          this.connectors[connectorId] = {
            data: {
              [queryName]: relativeNodes
            },
            listens: {
              [queryName]: nodes
            },
            mutations: connectorQuery.mutations || {}
          };
        }
      }
    });
  }

  // Calculates which connectors need to update based on an input of nodes and an exlude list
  getConnectorsToUpdate (nodes, exclude = []) {
    const connsToUpdate = [];
    forEach(this.connectors, (connector, connectorId) => {
      if (exclude.indexOf(connectorId) === -1) {
        forEach(connector.listens, (listenIds) => {
          if (intersection(nodes, listenIds).length !== 0) {
            connsToUpdate.push(connectorId);
            return false;
          }
        });
      }
    });
    return connsToUpdate;
  }

  // Check if any connector is listening to the mutation passed as argument
  checkMutationListeners (mutationName, relativeNodes, nodes) {
    const connsToUpdate = [];
    forEach(this.connectors, (connector, connectorId) => {
      const mutation = connector.mutations && connector.mutations[mutationName];
      if (mutation && mutation.constructor === Array) {
        // Connector was listening to this mutation
        connsToUpdate.push(connectorId);

        // make transformations
        forEach(mutation, (action) => {
          invariant(action.type, 'Relate: Mutation listener action type must be defined');
          invariant(action.field, 'Relate: Mutation listener action field must be defined');
          warning(
            (['INCREMENT', 'DECREMENT', 'APPEND', 'PREPEND']).indexOf(action.type) !== -1,
            `Relate: Mutation listener action invalid action type '${action.type}'`
          );

          if (action.type === 'INCREMENT' || action.type === 'DECREMENT') {
            const value = get(connector.data, action.field);

            if (typeof value === 'number') {
              set(connector.data, action.field, action.type === 'INCREMENT' ? value + 1 : value - 1);
            } else {
              warning(false, `Relate: Could not resolve a mutation action listener, value not found in connector '${action.field}'`);
            }
          } else if (action.type === 'APPEND' || action.type === 'PREPEND') {
            const arr = get(connector.data, action.field);

            if (arr && arr.constructor === Array) {
              const nodesToAdd = relativeNodes.constructor === Array ? relativeNodes : [relativeNodes];
              set(
                connector.data,
                action.field,
                action.type === 'APPEND' ? [...arr, ...nodesToAdd] : [...nodesToAdd, ...arr]
              );
              const listensPath = action.field.constructor === Array ? action.field[0] : action.field;
              set(
                connector.listens,
                listensPath,
                union(get(connector.listens, listensPath), nodes)
              );
            } else {
              warning(false, `Relate: Could not resolve a mutation action listener, array not found in connector '${action.field}'`);
            }
          }
        });
      }
    });
    return connsToUpdate;
  }

  // Removes a node from all the connectors who have it
  // return connectors to update
  removeNode (nodeId) {
    const connsToUpdate = [];
    forEach(this.connectors, (connector, connectorId) => {
      forEach(connector.listens, (listenIds, name) => {
        const ind = listenIds.indexOf(nodeId);
        if (ind !== -1) {
          connsToUpdate.indexOf(connectorId) === -1 && connsToUpdate.push(connectorId);
          listenIds.splice(ind, 1);

          // Check data as well
          const nameData = connector.data[name];
          if (nameData && nameData.constructor === Array) {
            const indData = nameData.indexOf(nodeId);
            if (indData !== -1) {
              nameData.splice(indData, 1);
            }
          } else if (nameData === nodeId) {
            connector.data[name] = null; // Singleton mark as dirty
          }
        }
      });
    });
    return connsToUpdate;
  }

  deleteConnector (connectorId) {
    this.connectors[connectorId] && delete this.connectors[connectorId];
  }
}

export default new Connectors();