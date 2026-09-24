import { NAME_MAX_LENGTH, parseName } from "@spot/shared";
import { useState } from "react";
import { Button } from "#/components/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/shadcn/dialog";
import { Field, FieldError, FieldLabel } from "#/components/shadcn/field";
import { Input } from "#/components/shadcn/input";

export const WelcomeDialog = ({
	open,
	error,
	onJoin,
}: {
	open: boolean;
	error: string | null;
	onJoin: (name: string) => void;
}) => {
	const [name, setName] = useState<string>("");
	const parsed = parseName(name);

	return (
		<Dialog open={open}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						if (parsed) onJoin(parsed);
					}}
				>
					<DialogHeader>
						<DialogTitle>Welcome!</DialogTitle>
						<DialogDescription>Feast your eyes upon spot!</DialogDescription>
					</DialogHeader>
					<div className="flex items-center gap-2">
						<Field>
							<FieldLabel
								htmlFor="name"
								className="text-muted-foreground font-light"
							>
								Who are you?
							</FieldLabel>
							<Input
								id="name"
								placeholder="John"
								value={name}
								maxLength={NAME_MAX_LENGTH}
								required
								onChange={(e) => setName(e.target.value)}
							/>
							{error && <FieldError>{error}</FieldError>}
						</Field>
					</div>
					<DialogFooter className="sm:justify-start">
						<Button type="submit" disabled={!parsed}>
							Join
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
