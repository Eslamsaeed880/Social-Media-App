import { jest } from '@jest/globals';

export const createListQueryChain = (resolvedValue, terminalMethod = 'limit') => {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
    };

    if (terminalMethod === 'sort') {
        chain.sort = jest.fn().mockResolvedValue(resolvedValue);
    } else {
        chain.limit = jest.fn().mockResolvedValue(resolvedValue);
    }

    return chain;
};

export const createPopulateChain = (resolvedValue, depth) => {
    if (!Number.isInteger(depth) || depth <= 0) {
        throw new Error('depth must be a positive integer');
    }

    let node = {
        populate: jest.fn().mockResolvedValueOnce(resolvedValue),
    };

    for (let level = 1; level < depth; level += 1) {
        node = {
            populate: jest.fn().mockReturnValueOnce(node),
        };
    }

    return node;
};
