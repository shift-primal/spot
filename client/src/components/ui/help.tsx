import { Monitor, Smartphone } from "lucide-react";
import { Fragment } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/shadcn/accordion";
import { Kbd, KbdGroup } from "#/components/shadcn/kbd";
import { GESTURES, SHORTCUTS } from "#/lib/options";
import type { Control } from "#/types";

const Keys = ({ keys }: { keys: string[][] }) => (
	<KbdGroup className="text-muted-foreground">
		{keys.map((combo, i) => (
			<Fragment key={combo.join("+")}>
				{i > 0 && <span>or</span>}
				{combo.map((key, j) => (
					<Fragment key={key}>
						{j > 0 && "+"}
						<Kbd>{key}</Kbd>
					</Fragment>
				))}
			</Fragment>
		))}
	</KbdGroup>
);

const Rows = ({ controls }: { controls: Control[] }) => (
	<dl className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
		{controls.map(({ label, keys }) => (
			<div key={label} className="contents">
				<dt className="text-muted-foreground">{label}</dt>
				<dd className="flex justify-end">
					<Keys keys={keys} />
				</dd>
			</div>
		))}
	</dl>
);

export const Controls = () => (
	<Accordion>
		<AccordionItem value="desktop">
			<AccordionTrigger className="items-center py-3">
				<span className="flex items-center gap-2">
					<Monitor className="size-4 text-muted-foreground" />
					Desktop controls
				</span>
			</AccordionTrigger>
			<AccordionContent>
				<Rows controls={SHORTCUTS} />
			</AccordionContent>
		</AccordionItem>
		<AccordionItem value="mobile">
			<AccordionTrigger className="items-center py-3">
				<span className="flex items-center gap-2">
					<Smartphone className="size-4 text-muted-foreground" />
					Mobile controls
				</span>
			</AccordionTrigger>
			<AccordionContent>
				<Rows controls={GESTURES} />
			</AccordionContent>
		</AccordionItem>
	</Accordion>
);
