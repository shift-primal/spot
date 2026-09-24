import { NAME_MAX_LENGTH, parseName, WORLD_SIZE } from "@spot/shared";
import { useState } from "react";
import { Button } from "#/components/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/shadcn/dialog";
import { Field, FieldError, FieldLabel } from "#/components/shadcn/field";
import { Input } from "#/components/shadcn/input";
import { Controls } from "#/components/ui/help";

export const WelcomeDialog = ({
	open,
	renaming,
	error,
	defaultName,
	onSubmit,
	onCancel,
}: {
	open: boolean;
	renaming: boolean;
	error: string | null;
	defaultName: string | null;
	onSubmit: (name: string) => void;
	onCancel: () => void;
}) => (
	<Dialog
		open={open}
		onOpenChange={(next) => {
			if (!next && renaming) onCancel();
		}}
	>
		<DialogContent
			className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
			showCloseButton={renaming}
		>
			<NameForm
				renaming={renaming}
				error={error}
				defaultName={defaultName}
				onSubmit={onSubmit}
			/>
		</DialogContent>
	</Dialog>
);

const NameForm = ({
	renaming,
	error,
	defaultName,
	onSubmit,
}: {
	renaming: boolean;
	error: string | null;
	defaultName: string | null;
	onSubmit: (name: string) => void;
}) => {
	const [name, setName] = useState<string>(defaultName ?? "");
	const parsed = parseName(name);

	return (
		<form
			className="contents"
			onSubmit={(e) => {
				e.preventDefault();
				if (parsed) onSubmit(parsed);
			}}
		>
			<DialogHeader>
				<DialogTitle>
					{renaming ? "Change name" : "Welcome to spot!"}
				</DialogTitle>
				<DialogDescription>
					{renaming
						? "This is what others see next to your cursor."
						: `One shared ${WORLD_SIZE.width.toLocaleString()} × ${WORLD_SIZE.height.toLocaleString()} px canvas. Draw together in real time and watch everyone's cursors move.`}
				</DialogDescription>
			</DialogHeader>
			<Field>
				<FieldLabel htmlFor="name">Who are you?</FieldLabel>
				<div className="flex gap-2">
					<Input
						id="name"
						placeholder="Your name"
						autoComplete="nickname"
						value={name}
						maxLength={NAME_MAX_LENGTH}
						required
						onChange={(e) => setName(e.target.value)}
					/>
					<Button type="submit" disabled={!parsed}>
						{renaming ? "Save" : "Join"}
					</Button>
				</div>
				{error && <FieldError>{error}</FieldError>}
			</Field>
			<Controls />
		</form>
	);
};
