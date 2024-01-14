CREATE OR REPLACE FUNCTION notify_block_update() RETURNS TRIGGER AS $$
DECLARE
    row RECORD;
    output TEXT;

BEGIN
    -- Checking the Operation Type
    IF (TG_OP = 'DELETE') THEN
        row = OLD;
    ELSE
        row = NEW;
    END IF;

    output = jsonb_build_object('op', TG_OP, 'slot', row.slot, 'hash', ENCODE(row.hash, 'hex'));

    -- Calling the pg_notify for block_update event with output as payload

    PERFORM pg_notify('block_update',output);

    -- Returning null because it is an after trigger.
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_block_update
    AFTER INSERT OR UPDATE OR DELETE
    ON "Block"
    FOR EACH ROW
EXECUTE PROCEDURE notify_block_update();
-- We can not use TRUNCATE event in this trigger because it is not supported in case of FOR EACH ROW Trigger

-- Registering the block_update channel to receive the notification.
LISTEN block_update;
