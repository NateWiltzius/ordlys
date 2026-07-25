'use client';

import StatusAlert from '@/components/shared/status-alert';
import { Vocab } from '@/types/vocab.types';
import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useEffect, useState } from 'react';

type Props = {
  vocab: Vocab | null;
  currentPosition: number;
  totalPositions: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMove: (position: number) => Promise<string | null>;
};

export default function MoveVocabModal({
  vocab,
  currentPosition,
  totalPositions,
  isOpen,
  onOpenChange,
  onMove,
}: Props) {
  const modalState = useOverlayState({ isOpen, onOpenChange });
  const [position, setPosition] = useState(currentPosition);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPosition(currentPosition);
    setError(null);
  }, [currentPosition, isOpen, vocab?.id]);

  const isValidPosition = Number.isInteger(position) && position >= 1 && position <= totalPositions;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vocab || !isValidPosition || position === currentPosition || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const moveError = await onMove(position);
      if (moveError) {
        setError(moveError);
        return;
      }
      modalState.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reorder the card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={modalState.isOpen} onOpenChange={modalState.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="min-h-0 sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header className="space-y-1">
            <Modal.Heading>Move card</Modal.Heading>
            <p className="text-sm text-default-500">
              {vocab ? (
                <>
                  Move <span className="font-medium text-default-700">{vocab.front}</span> from
                  position {currentPosition} of {totalPositions}.
                </>
              ) : null}
            </p>
          </Modal.Header>
          <form onSubmit={handleSubmit}>
            <Modal.Body className="space-y-4">
              <div className="form-field">
                <Label htmlFor="vocab-position">New position</Label>
                <Input
                  id="vocab-position"
                  type="number"
                  min={1}
                  max={totalPositions}
                  step={1}
                  value={String(position)}
                  onChange={event => setPosition(event.target.valueAsNumber)}
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-xs text-default-500">
                  Enter a number from 1 to {totalPositions}.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => setPosition(1)}
                  isDisabled={isSubmitting || totalPositions < 2}
                >
                  Move to first
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => setPosition(totalPositions)}
                  isDisabled={isSubmitting || totalPositions < 2}
                >
                  Move to last
                </Button>
              </div>
              {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
            </Modal.Body>
            <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="tertiary"
                className="w-full sm:w-auto"
                isDisabled={isSubmitting}
                onPress={modalState.close}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                isPending={isSubmitting}
                isDisabled={!isValidPosition || position === currentPosition}
              >
                Move card
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
