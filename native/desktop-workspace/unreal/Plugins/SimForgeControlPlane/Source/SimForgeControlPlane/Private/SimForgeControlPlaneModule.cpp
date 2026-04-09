#include "Modules/ModuleManager.h"

class FSimForgeControlPlaneModule : public IModuleInterface
{
public:
    virtual void StartupModule() override {}
    virtual void ShutdownModule() override {}
};

IMPLEMENT_MODULE(FSimForgeControlPlaneModule, SimForgeControlPlane)
