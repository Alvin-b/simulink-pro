#include "SimForgeControlPlaneSubsystem.h"

void USimForgeControlPlaneSubsystem::PublishRunStatus(const FString& RunId, const FString& Status)
{
    UE_LOG(LogTemp, Log, TEXT("SimForge control-plane update: run=%s status=%s"), *RunId, *Status);
}

FString USimForgeControlPlaneSubsystem::GetControlPlaneEndpoint() const
{
    return TEXT("http://127.0.0.1:4010");
}
