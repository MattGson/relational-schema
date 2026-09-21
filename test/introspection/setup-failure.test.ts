jest.mock('src/index', () => ({ generate: jest.fn() }));
jest.mock('src/lib/logger', () => ({ logger: { error: jest.fn() } }));
jest.mock('../helpers/build-test-db', () => ({ buildDBSchemas: jest.fn(), closeConnection: jest.fn() }));

describe('introspection setup failures', () => {
    const originalExitCode = process.exitCode;

    afterEach(() => {
        process.exitCode = originalExitCode;
        jest.resetModules();
    });

    it.each(['database setup', 'generation'])('fails the process when %s fails', async (stage) => {
        const { generate } = require('src/index');
        const { buildDBSchemas, closeConnection } = require('../helpers/build-test-db');
        (buildDBSchemas as jest.Mock).mockImplementation(() =>
            stage === 'database setup' ? Promise.reject(new Error('setup failed')) : Promise.resolve({}),
        );
        (generate as jest.Mock).mockRejectedValue(new Error('generation failed'));
        (closeConnection as jest.Mock).mockResolvedValue(undefined);
        require('../helpers/introspect');
        await new Promise((resolve) => setImmediate(resolve));
        expect(process.exitCode).toBe(1);
        expect(closeConnection).toHaveBeenCalledTimes(1);
    });
});
