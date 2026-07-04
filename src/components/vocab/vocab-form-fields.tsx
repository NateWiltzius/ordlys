import { Vocab } from '@/types/vocab.types';
import { Input, Label, TextArea } from '@heroui/react';

type Props = {
  vocab?: Vocab;
};

export default function VocabFormFields({ vocab }: Props) {
  return (
    <>
      <Label className="text-sm text-default-600" htmlFor="front">
        Front
      </Label>
      <Input id="front" name="front" required className="w-full" defaultValue={vocab?.front} />

      <Label className="text-sm text-default-600" htmlFor="back">
        Back
      </Label>
      <Input id="back" name="back" required className="w-full" defaultValue={vocab?.back} />

      <Label className="text-sm text-default-600" htmlFor="reading">
        Reading
      </Label>
      <Input id="reading" name="reading" className="w-full" defaultValue={vocab?.reading ?? ''} />

      <Label className="text-sm text-default-600" htmlFor="frontAlternatives">
        Front alternatives
      </Label>
      <TextArea
        id="frontAlternatives"
        name="frontAlternatives"
        rows={3}
        placeholder="One accepted answer per line"
        className="w-full"
        defaultValue={vocab?.frontAlternatives.join('\n')}
      />

      <Label className="text-sm text-default-600" htmlFor="backAlternatives">
        Back alternatives
      </Label>
      <TextArea
        id="backAlternatives"
        name="backAlternatives"
        rows={3}
        placeholder="One accepted answer per line"
        className="w-full"
        defaultValue={vocab?.backAlternatives.join('\n')}
      />
    </>
  );
}
