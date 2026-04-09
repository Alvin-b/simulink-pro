#pragma once

#include "Subsystems/GameInstanceSubsystem.h"
#include "SimForgeControlPlaneSubsystem.generated.h"

UCLASS()
class SIMFORGECONTROLPLANE_API USimForgeControlPlaneSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="SimForge")
    void PublishRunStatus(const FString& RunId, const FString& Status);

    UFUNCTION(BlueprintCallable, Category="SimForge")
    FString GetControlPlaneEndpoint() const;
};
