import {mergeFragments} from 'relax-fragments';

import actionTypes from './actions/types';
import dataConnect from './decorators/data-connect';
import getDataDependencies from './server/get-data-dependencies';
import mutation from './actions/mutation';
import rootDataConnect from './decorators/root-data-connect';
import {setHeader, removeHeader, setEndpoint, setBody, removeBody} from './actions/settings';
import {relateReducer, relateReducerInit} from './reducer/reducer';
import Network from './helpers/Network';
const setNetworkInterface = Network.setInterface;

export {
  dataConnect,
  rootDataConnect,
  relateReducer,
  relateReducerInit,
  actionTypes,
  mutation,
  mergeFragments,
  setHeader,
  removeHeader,
  setEndpoint,
  setBody,
  removeBody,
  getDataDependencies,
  setNetworkInterface
};

export default {
  dataConnect,
  rootDataConnect,
  relateReducer,
  relateReducerInit,
  actionTypes,
  mutation,
  mergeFragments,
  setHeader,
  removeHeader,
  setEndpoint,
  setBody,
  removeBody,
  getDataDependencies,
  setNetworkInterface
};
