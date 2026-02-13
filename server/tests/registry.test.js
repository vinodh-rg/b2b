const registry = require('../registry');

describe('Device Registry', () => {
    beforeEach(() => {
        // Clear registry before each test
        registry.devices = new Map();
        registry.trusted = new Map();
    });

    test('should register a new device', () => {
        const info = { name: 'Test Device', info: { ua: 'Jest' } };
        const device = registry.register(info);

        expect(device.id).toBeDefined();
        expect(device.name).toBe('Test Device');
        expect(registry.get(device.id)).toEqual(device);
    });

    test('should update an existing device', () => {
        const device = registry.register({ name: 'Old Name' });
        registry.update(device.id, { name: 'New Name' });

        expect(registry.get(device.id).name).toBe('New Name');
    });

    test('should remove a device', () => {
        const device = registry.register({ name: 'Temp' });
        registry.remove(device.id);

        expect(registry.get(device.id)).toBeUndefined();
    });

    test('should manage trusted devices', () => {
        const id1 = 'device-1';
        const id2 = 'device-2';

        registry.addTrusted(id1, id2);

        expect(registry.getTrusted(id1)).toContain(id2);
        expect(registry.getTrusted(id2)).toContain(id1);
    });
});
