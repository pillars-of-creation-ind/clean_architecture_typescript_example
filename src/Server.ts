import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';

import express, { Request, Response, NextFunction } from 'express';
import { BAD_REQUEST } from 'http-status-codes';
import 'express-async-errors';

import BaseRouter from './infrastructure/web/routes';
import logger from '@shared/Logger';
import { UniqueEntityIDGeneratorFactory } from '@entities';
import UUIDEntityGenerator from '@infrastructure/plugins/uuid-id-generator';
import * as Adapters from '@adapters';
import mappers from '@infrastructure/plugins/mappers';

const MapperRegistry = Adapters.Gateways.MapperRegistry;

// init id factories

const factories = {
    'default': new UUIDEntityGenerator()
};

UniqueEntityIDGeneratorFactory
    .getInstance()
    .initialize(factories);

console.log('Entity ID Generators initialized');

MapperRegistry
    .initialize(mappers);

console.log('Mappers initialized');
// Init express
const app = express();

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}

// Add APIs
app.use('/api', BaseRouter);

// Print API errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
        error: err.message,
    });
});

/************************************************************************************
 *                              Serve front-end content
 ***********************************************************************************/

const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Export express instance
export default app;
