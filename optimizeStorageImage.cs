using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;

namespace Delirium.ImageOptimizer
{
    public static class optimizeStorageImage
    {
        [FunctionName("optimizeStorageImage")]
        public static async Task RunAsync([BlobTrigger("photos/{name}", Connection = "")]
            Stream myBlob, string name, ILogger log)
        {
            log.LogInformation($"C# Blob trigger function Processed blob\n Name:{name} \n Size: {myBlob.Length} Bytes");
            
        }
    }
}