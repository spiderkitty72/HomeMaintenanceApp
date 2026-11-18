"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Info, Github, Box, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import packageJson from "../../../package.json";
import { Card, CardContent } from "@/components/ui/card";

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Opened from the settings menu (desktop) or the mobile menu. */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About MaintenanceApp
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Version Display */}
                    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-border/50">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Version</span>
                        <span className="text-4xl font-black text-primary font-mono tracking-tight">v{packageJson.version}</span>
                    </div>

                    {/* Links */}
                    <div className="space-y-3">
                        <Card className="hover:border-primary/50 transition-colors shadow-none">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-md">
                                        <Github className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">GitHub Repository</span>
                                        <span className="text-xs text-muted-foreground">Source code and issue tracking</span>
                                    </div>
                                </div>
                                <a 
                                    href="https://github.com/spiderkitty72/HomeMaintenanceApp" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-none">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-md">
                                        <Box className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">DockerHub</span>
                                        <span className="text-xs text-muted-foreground">Pull the latest container image</span>
                                    </div>
                                </div>
                                <a 
                                    href="https://hub.docker.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
